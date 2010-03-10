from django.contrib.gis.db import models
from django.core.management.color import no_style
from django.core.management.sql import custom_sql_for_model
from django.db import connection, transaction

from domain import sql
from domain.models import TableColumnDescriptor

def get_table_model(table_descriptor):
	class Meta:
		pass
		
	attrs = {'__module__': 'domain.models', 'Meta': Meta}
	
	table_column_descriptors = TableColumnDescriptor.objects.filter(table=table_descriptor)
	
	for column in table_column_descriptors:
		if column.data_type == sql.TYPE_CHARACTER:
			attrs[column.db_column_name] = models.CharField(max_length=sql.DEFAULT_CHARACTER_LENGTH, null=True)
			
		elif column.data_type == sql.TYPE_NUMBER:
			attrs[column.db_column_name] = models.FloatField(null=True)
			
		elif column.data_type == sql.TYPE_DATETIME:
			attrs[column.db_column_name] = models.DateTimeField(null=True)
			
		elif column.data_type == sql.TYPE_DATE:
			attrs[column.db_column_name] = models.DateField(null=True)
			
		elif column.data_type == sql.TYPE_TIME:
			attrs[column.db_column_name] = models.TimeField(null=True)
			
		elif column.data_type == sql.TYPE_REGION:
			attrs[column.db_column_name] = models.MultiPolygonField(null=True)
			
		elif column.data_type == sql.TYPE_POINT:
			attrs[column.db_column_name] = models.PointField(null=True)
			
	attrs['objects'] = models.GeoManager()
	
	model_class = type(str(table_descriptor.class_name), (models.Model,), attrs) # user_table.table_class_name return as 'unicode', convert to string
	
	return model_class

def create_db_table(table_descriptor, table_column_descriptors):
	model_class = get_table_model(table_descriptor)
	
	style = no_style()
	
	sql, references = connection.creation.sql_create_model(model_class, style)
	
	cursor = connection.cursor()
	for statement in sql:
		cursor.execute(statement)
		
	transaction.commit_unless_managed()
	
	custom_sql = custom_sql_for_model(model_class, style)
	
	if custom_sql:
		try:
			for sql in custom_sql:
				cursor.execute(sql)
		except Exception, e:
			transaction.rollback_unless_managed()
		else:
			transaction.commit_unless_managed()
	
	# Return physical table name
	return connection.introspection.table_name_converter(model_class._meta.db_table)

def get_table_data(table_descriptor):
	return get_table_model(table_descriptor).objects.all()
	
	
	