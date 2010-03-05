
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from domain.models import ThailandProvince

def after_syncdb(sender, **kwargs):
	Site.objects.all().update(domain=settings.WEBSITE_ADDRESS, name=settings.WEBSITE_ADDRESS)
	
	try:
		first_user = User.objects.get(username='panuta')
		first_account = first_user.get_profile()
	except User.DoesNotExist:
		first_user = User.objects.create_user('panuta', 'panuta@gmail.com', 'panuta')
		first_user.is_superuser = True
		first_user.is_staff = True
		first_user.save()
		
		first_account = first_user.get_profile()
		first_account.first_name = 'Panu'
		first_account.last_name = 'Tangchalermkul'
		first_account.save()
	
	from workspace.models import Workspace
	Workspace.objects.get_or_create(name='Test1', created_by=first_account)
	
	"""
	MUST perform syncdb WITHOUT these codes first, then run syncdb again to add these data
	"""
	#ThailandProvince.objects.get_or_create(name='Bangkok', location='POINT(100.49159 13.75071)', region='POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10))')
	#ThailandProvince.objects.get_or_create(name='Samutprakarn', location='POINT(100.59695 13.59918)', region='POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10))')

from django.db.models.signals import post_syncdb
post_syncdb.connect(after_syncdb, dispatch_uid="domain.management")
