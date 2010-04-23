
from helper.constants import *

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

def serialize_spatial(value):
	try:
		return value.wkt
	except:
		return ''
	
	
	
	