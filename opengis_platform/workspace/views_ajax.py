from django.conf import settings
from django.db.models import Max
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.utils import simplejson

from models import *

from accounts.models import UserProject
from project.models import TableDescriptor, TableColumnDescriptor
from project.functions import get_table_model

from helper.utilities import change_to_extjs_field_type, serialize_spatial

@login_required
def ajax_get_adding_tables(request):
	workspace_id = request.GET.get('workspace_id')
	
	try:
		workspace = Workspace.objects.get(pk=workspace_id)
	except:
		pass
		# TODO: response error
	
	existing_layers = WorkspaceLayer.objects.filter(workspace=workspace)
	
	user_projects = UserProject.objects.filter(user=request.user.get_profile())
	
	rows = []
	for user_project in user_projects:
		tables = TableDescriptor.objects.filter(project=user_project.project)
		
		for table in tables:
			is_added = False
			
			for existing_layer in existing_layers:
				if existing_layer.table == table:
					is_added = True
			
			if not is_added:
				rows.append({'id':table.id, 'name':table.name, 'project_name':user_project.project.name})
			
	metadata = {
		'idProperty':'id',
		'root':'rows',
		'sort_info':{'field':'project_name','direction':'ASC'},
		'fields':[
			{'name':'id','type':'string'},
			{'name':'name','type':'string'},
			{'name':'project_name','type':'string'},
		]}
	
	return HttpResponse(simplejson.dumps({'metaData':metadata, 'success':True, 'results':len(rows), 'rows':rows}))

@login_required
def ajax_add_table_layer(request):
	workspace_id = request.GET.get('workspace_id')
	layer_name = request.GET.get('layer_name')
	table_id = request.GET.get('table_id')
	
	try:
		workspace = Workspace.objects.get(pk=workspace_id)
	except:
		pass
	
	try:
		table = TableDescriptor.objects.get(pk=table_id)
	except:
		pass
	
	max_ordering = WorkspaceLayer.objects.filter(workspace=workspace).aggregate(Max('ordering'))['ordering__max']
	new_layer = WorkspaceLayer.objects.create(workspace=workspace, name=layer_name, table=table, ordering=max_ordering+1)
	
	return HttpResponse(simplejson.dumps({'id':new_layer.id, 'source_name': table.project.name+' - '+table.name, 'spatial_type':table.spatial_type}))

@login_required
def ajax_get_layer_schema(request):
	layer_id = request.GET.get('layer_id')
	
	layer = WorkspaceLayer.objects.get(pk=layer_id)
	table_columns = TableColumnDescriptor.objects.filter(table=layer.table)
	
	columns = []
	for column in table_columns:
		columns.append({'id':column.id, 'name':column.name, 'type':change_to_extjs_field_type(column.data_type)})
	
	return HttpResponse(simplejson.dumps(columns))

@login_required
def ajax_get_layer_data(request):
	layer_id = request.GET.get('layer_id')
	
	if layer_id:
		layer = WorkspaceLayer.objects.get(pk=layer_id)
		table_columns = TableColumnDescriptor.objects.filter(table=layer.table)
		
		fields = []
		columns = []
		for table_column in table_columns:
			fields.append({'name':table_column.db_column_name, 'type':change_to_extjs_field_type(table_column.data_type)})
			columns.append({'name':table_column.db_column_name, 'header':table_column.name, 'dataIndex':table_column.db_column_name})
		
		metadata = {'idProperty':'id', 'root':'rows','sort_info':{'field':'id','direction':'ASC'},'fields':fields}
		
		from project.functions import get_table_data
		data = get_table_data(layer.table)
		
		rows = []
		for datum in data:
			datum_columns = {'id':datum.id}
			for table_column in table_columns:
				datum_columns[table_column.db_column_name] = getattr(datum, table_column.db_column_name)
			
			rows.append(datum_columns)
		
		table_data = {'metaData':metadata, 'success':True, 'results':len(data), 'rows':rows, 'columns':columns}
		
		return HttpResponse(simplejson.dumps(table_data))
	
	return HttpResponse('')

@login_required
def ajax_insert_layer_data(request):
	layer_id = request.POST.get('layer_id')
	spatial_data = request.POST.get('spatial')
	
	layer = WorkspaceLayer.objects.get(pk=layer_id)
	table_columns = TableColumnDescriptor.objects.filter(table=layer.table)
	
	table_model = get_table_model(layer.table)
	row_obj = table_model()
	setattr(row_obj, settings.TABLE_SPATIAL_COLUMN_NAME, spatial_data)
	
	for column in table_columns:
		data = request.POST.get(str(column.id))
		setattr(row_obj, column.db_column_name, data)
	
	row_obj.save()
	
	return HttpResponse(row_obj.id)

@login_required
def ajax_save_layer_geo_data(request):
	layer_id = request.POST.get('layer_id')
	rows = request.POST.getlist('row')
	
	layer = WorkspaceLayer.objects.get(pk=layer_id)
	
	from project.functions import save_table_spatial_data
	for row in rows:
		(row_id, separator, wkt) = row.partition(',')
		save_table_spatial_data(layer.table, row_id, wkt)
	
	return HttpResponse('')



@login_required
def ajax_get_layer_row_structure(request):
	layer_id = request.GET.get('layer_id')
	
	pass

@login_required
def ajax_get_layer_row_data(request):
	layer_id = request.GET.get('layer_id')
	row_id = request.GET.get('row_id')
	
	return HttpResponse('')












@login_required
def ajax_get_table_spatial_data(request):
	layer_ids = request.GET.getlist('layer')
	
	if layer_ids:
		layers = []
		for layer_id in layer_ids:
			layer = WorkspaceLayer.objects.get(pk=layer_id)
			
			from project.functions import get_table_data
			data = get_table_data(layer.table)
			
			rows = []
			for datum in data:
				datum_columns = {'id':datum.id, 'spatial':serialize_spatial(getattr(datum, 'spatial'))}
				rows.append(datum_columns)
			
			layers.append({'id':layer.id, 'name':layer.name, 'spatial_type':layer.table.spatial_type, 'rows':rows})
			
		return HttpResponse(simplejson.dumps({'layers':layers}))
	
	return HttpResponse('')

@login_required
def ajax_get_table_data_extjs(request):
	layer_id = request.GET.get('id')
	
	if layer_id:
		layer = WorkspaceLayer.objects.get(pk=layer_id)
		table_columns = TableColumnDescriptor.objects.filter(table=layer.table)
		
		fields = []
		columns = []
		for table_column in table_columns:
			fields.append({'name':table_column.db_column_name, 'type':change_to_extjs_field_type(table_column.data_type)})
			columns.append({'name':table_column.db_column_name, 'header':table_column.name, 'dataIndex':table_column.db_column_name})
		
		metadata = {'idProperty':'id', 'root':'rows','sort_info':{'field':'id','direction':'ASC'},'fields':fields}
		
		from project.functions import get_table_data
		data = get_table_data(layer.table)
		
		rows = []
		for datum in data:
			datum_columns = {'id':datum.id}
			for table_column in table_columns:
				datum_columns[table_column.db_column_name] = getattr(datum, table_column.db_column_name)
			
			rows.append(datum_columns)
		
		table_data = {'metaData':metadata, 'success':True, 'results':len(data), 'rows':rows, 'columns':columns}
		
		return HttpResponse(simplejson.dumps(table_data))
	
	return HttpResponse('')


	