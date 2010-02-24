
from domain.models import ThailandProvince

def after_syncdb(sender, **kwargs):
	ThailandProvince.objects.get_or_create(name='Bangkok', location='POINT(100.49159 13.75071)', region='POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10))')
	ThailandProvince.objects.get_or_create(name='Samutprakarn', location='POINT(100.59695 13.59918)', region='POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10))')
	


from django.db.models.signals import post_syncdb
post_syncdb.connect(after_syncdb, dispatch_uid="domain.management")
