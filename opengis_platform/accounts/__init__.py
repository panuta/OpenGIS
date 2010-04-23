# Callback after a user object is saved
from django.contrib.auth.models import User
from django.db.models.signals import post_save

from models import UserProfile

def user_post_save_callback(sender, instance, created, *args, **kwargs):
	if created: UserProfile.objects.get_or_create(user=instance)

post_save.connect(user_post_save_callback, sender=User)