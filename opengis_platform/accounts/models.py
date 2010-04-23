from django.contrib.auth.models import User
from django.db import models

# USER
class UserProfile(models.Model):
	user = models.ForeignKey(User, unique=True)
	first_name = models.CharField(max_length=512)
	last_name = models.CharField(max_length=512)

class UserProject(models.Model): # Project member
	user = models.ForeignKey('UserProfile')
	project = models.ForeignKey('project.Project')
	level = models.IntegerField(default=1) # 5 -> Normal User, 9 -> Admin User

