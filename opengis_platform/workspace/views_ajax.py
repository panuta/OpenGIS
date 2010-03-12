from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.utils import simplejson

from models import *

from domain import sql
from domain.models import TableColumnDescriptor

from helper.utilities import change_to_extjs_field_type, serialize_spacial

@login_required
def ajax_get_layer_extjs_data(request):
	layer_id = request.GET.get('id')
	
	if layer_id:
		layer = WorkspaceLayer.objects.get(pk=layer_id)
		table_columns = TableColumnDescriptor.objects.filter(table=layer.table)
		
		display_columns = []
		for table_column in table_columns:
			if table_column.data_type not in (sql.TYPE_REGION, sql.TYPE_POINT):
				display_columns.append(table_column)
		
		fields = []
		columns = []
		for display_column in display_columns:
			fields.append({'name':display_column.db_column_name, 'type':change_to_extjs_field_type(display_column.data_type)})
			columns.append({'name':display_column.db_column_name, 'header':display_column.name, 'dataIndex':display_column.db_column_name})
		
		metadata = {'idProperty':'id', 'root':'rows','sort_info':{'field':'id','direction':'ASC'},'fields':fields}
		
		from domain.functions import get_table_data
		data = get_table_data(layer.table)
		
		rows = []
		for datum in data:
			datum_columns = {'id':datum.id}
			for display_column in display_columns:
				datum_columns[display_column.db_column_name] = serialize_spacial(getattr(datum, display_column.db_column_name))
			
			rows.append(datum_columns)
		
		table_data = {'metaData':metadata, 'success':True, 'results':len(data), 'rows':rows, 'columns':columns}
		
		return HttpResponse(simplejson.dumps(table_data))
	
	return HttpResponse('')

@login_required
def ajax_get_layers_map_data(request):
	layer_ids = request.GET.getlist('layer')
	
	if layer_ids:
		layers = []
		for layer_id in layer_ids:
			layer = WorkspaceLayer.objects.get(pk=layer_id)
			table_columns = TableColumnDescriptor.objects.filter(table=layer.table)
			
			display_columns = []
			for table_column in table_columns:
				if table_column.data_type in (sql.TYPE_REGION, sql.TYPE_POINT):
					display_columns.append(table_column)
			
			from domain.functions import get_table_data
			data = get_table_data(layer.table)
			
			rows = []
			for datum in data:
				datum_columns = {'id':datum.id, 'spacial':[]}
				for display_column in display_columns:
					datum_columns['spacial'].append(serialize_spacial(getattr(datum, display_column.db_column_name)))
					
				rows.append(datum_columns)
			
			layers.append({'id':layer.id, 'name':layer.name, 'rows':rows})
			
		return HttpResponse(simplejson.dumps({'layers':layers}))
	
	return HttpResponse('')
	