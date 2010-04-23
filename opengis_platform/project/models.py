from django.db import models

DEFAULT_CHARACTER_LENGTH = 512 # Use when create table

# PROJECT
class Project(models.Model):
	name = models.CharField(max_length=512)
	created_by = models.ForeignKey('accounts.UserProfile')
	created = models.DateTimeField(auto_now_add=True)

# TABLE
class TableDescriptor(models.Model):
	project = models.ForeignKey('Project')
	name = models.CharField(max_length=512)
	class_name = models.CharField(max_length=512) # Name to be used for django model class
	description = models.CharField(max_length=512, blank=True)
	share_level = models.IntegerField(default=1)
	spatial_type = models.IntegerField() # See helper.constants
	created = models.DateTimeField(auto_now_add=True)
	created_by = models.ForeignKey('accounts.UserProfile')

class TableColumnDescriptor(models.Model):
	table = models.ForeignKey('TableDescriptor')
	name = models.CharField(max_length=512) # Name to be displayed to user
	db_column_name = models.CharField(max_length=512, null=True) # Name to be saved as a column name in DBMS
	data_type = models.IntegerField() # See helper.constants
	created = models.DateTimeField(auto_now_add=True)
	