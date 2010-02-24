from django.db import models

# USER

class UserProfile(models.Model):
	first_name = models.CharField(max_length=256)
	last_name = models.CharField(max_length=256)

class UserProject(models.Model):
	user = models.ForeignKey('UserProfile')
	project = models.ForeignKey('Project')
	level = models.IntegerField(default=1) # 5 -> Normal User, 9 -> Admin User

# PROJECT

class Project(models.Model):
	name = models.CharField(max_length=512)
	created_by = models.ForeignKey('UserProfile')
	created = models.DateTimeField(auto_now_add=True)

# TABLE

class TableDescriptor(models.Model):
	project = models.ForeignKey('Project')
	name = models.CharField(max_length=512)
	class_name = models.CharField(max_length=512)
	description = models.CharField(max_length=512)
	share_level = models.IntegerField(default=1)
	created = models.DateTimeField(auto_now_add=True)
	created_by = models.ForeignKey('UserProfile')

class TableColumnDescriptor(models.Model):
	table = models.ForeignKey('TableDescriptor')
	name = models.CharField(max_length=512)
	db_column_name = models.CharField(max_length=512, null=True)
	data_type = models.IntegerField()
	created = models.DateTimeField(auto_now_add=True)


from django.contrib.gis.db import models as gis_models

class ThailandProvince(gis_models.Model):
	name = gis_models.CharField(max_length=256)
	region = gis_models.PolygonField(null=True)
	location = gis_models.PointField(null=True)
	objects = gis_models.GeoManager()

