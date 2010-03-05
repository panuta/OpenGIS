from django.db import models

class Workspace(models.Model):
	name = models.CharField(max_length=256)
	created = models.DateTimeField(auto_now_add=True)
	created_by = models.ForeignKey('domain.UserProfile')

class WorkspaceLayer(models.Model):
	table = models.ForeignKey('domain.TableDescriptor')
	is_visible = models.BooleanField(default=True)
	ordering = models.IntegerField()



