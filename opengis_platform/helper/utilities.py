
from domain.sql import *

def change_to_extjs_field_type(data_type):
	if data_type == TYPE_CHARACTER:
		return 'string'
	elif data_type == TYPE_NUMBER:
		return 'int'
	elif data_type == TYPE_DATETIME:
		return 'date'
	elif data_type == TYPE_DATE:
		return 'date'
	elif data_type == TYPE_TIME:
		return 'date'
	elif data_type == TYPE_REGION:
		return 'region'
	elif data_type == TYPE_POINT:
		return 'point'

from django.contrib.gis.geos.collections import *

def serialize_spacial(value):
	if isinstance(value, Point):
		return value.wkt
	elif isinstance(value, MultiPolygon):
		return value.wkt
	
	return value
	
	
	
	