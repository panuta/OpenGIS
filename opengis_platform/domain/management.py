
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.sites.models import Site

from domain.models import Project, TableDescriptor, TableColumnDescriptor
from domain.sql import *
#from domain.models import ThailandProvince

from workspace.models import Workspace, WorkspaceLayer

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
	
	project, created = Project.objects.get_or_create(name='My Project', created_by=first_account)
	
	if created:
		from domain.functions import get_table_model, create_db_table
		
		table1 = TableDescriptor.objects.create(project=project, name='Table 1', class_name='db_table1', created_by=first_account)
		
		columns = [
			TableColumnDescriptor.objects.create(table=table1, name='Person', db_column_name='column1', data_type=TYPE_CHARACTER),
			TableColumnDescriptor.objects.create(table=table1, name='Position', db_column_name='column2', data_type=TYPE_POINT),
		]
		create_db_table(table1, columns)
		
		table1_model = get_table_model(table1)
		table1_model.objects.create(column1='Som Chai', column2='POINT(100.49159 13.75071)')
		table1_model.objects.create(column1='Som Ying', column2='POINT(101.49159 13.75071)')
		
		table2 = TableDescriptor.objects.create(project=project, name='Table 2', class_name='db_table2', created_by=first_account)
		
		columns = [
			TableColumnDescriptor.objects.create(table=table2, name='Thing', db_column_name='column1', data_type=TYPE_CHARACTER),
			TableColumnDescriptor.objects.create(table=table2, name='Position', db_column_name='column2', data_type=TYPE_POINT),
		]
		create_db_table(table2, columns)
		
		table1_model = get_table_model(table2)
		table1_model.objects.create(column1='Model', column2='POINT(105.49159 13.75071)')
		table1_model.objects.create(column1='Box', column2='POINT(106.49159 13.75071)')
		
	
	workspace1, created = Workspace.objects.get_or_create(name='Sample Workspace 1', created_by=first_account)
	
	if created:
		WorkspaceLayer.objects.create(workspace=workspace1, name='Layer for table1', table=table1, is_show_map=True, is_show_data=False, ordering=1)
		WorkspaceLayer.objects.create(workspace=workspace1, name='Layer for table2', table=table2, is_show_map=True, is_show_data=True, ordering=2)
	
	
	"""
	MUST perform syncdb WITHOUT these codes first, then run syncdb again to add these data
	"""
	#ThailandProvince.objects.get_or_create(name='Bangkok', location='POINT(100.49159 13.75071)', region='POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10))')
	#ThailandProvince.objects.get_or_create(name='Samutprakarn', location='POINT(100.59695 13.59918)', region='POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10))')

from django.db.models.signals import post_syncdb
post_syncdb.connect(after_syncdb, dispatch_uid="domain.management")
