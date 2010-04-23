from django.db import models

class Workspace(models.Model):
	name = models.CharField(max_length=256)
	map_center_lat = models.CharField(max_length=256, blank=True)
	map_center_lng = models.CharField(max_length=256, blank=True)
	map_zoom = models.IntegerField(default=0)
	created = models.DateTimeField(auto_now_add=True)
	created_by = models.ForeignKey('accounts.UserProfile')

class WorkspaceLayer(models.Model):
	workspace = models.ForeignKey('Workspace')
	name = models.CharField(max_length=256)
	table = models.ForeignKey('project.TableDescriptor')
	is_show = models.BooleanField(default=True)
	ordering = models.IntegerField()

