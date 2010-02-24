from django.http import HttpResponse
from django.utils import simplejson

from models import ThailandProvince

def ajax_load_table_data(request, table_id):
	
	metadata = {'idProperty':'id', 'root':'rows','sort_info':{'field':'name','direction':'ASC'},'fields':(
		{'name':'name'},
		{'name':'location'},
		{'name':'region'},
	)}
	
	provinces = ThailandProvince.objects.all()
	
	rows = list()
	for province in provinces:
		rows.append({'id':province.id, 'name':province.name, 'location':province.location.wkt, 'region':province.region.wkt})
	
	table_data = {'metaData':metadata, 'success':True, 'results':2, 'rows':rows}
	
	return HttpResponse(simplejson.dumps(table_data))