
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.sites.models import Site

from helper.constants import *

from accounts.models import UserProject
from project.models import Project, TableDescriptor, TableColumnDescriptor
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
	
	"""
	project, created = Project.objects.get_or_create(name='My Project', created_by=first_account)
	
	UserProject.objects.get_or_create(user=first_account, project=project)
	
	if created:
		from project.functions import get_table_model, create_db_table
		
		table1 = TableDescriptor.objects.create(project=project, name='Table 1', class_name='db_table1', spatial_type=3, created_by=first_account)
		
		columns = [
			TableColumnDescriptor.objects.create(table=table1, name='Person', db_column_name='column1', data_type=TYPE_CHARACTER),
			TableColumnDescriptor.objects.create(table=table1, name='Position', db_column_name='column2', data_type=TYPE_CHARACTER),
		]
		create_db_table(table1, columns)
		
		table1_model = get_table_model(table1)
		table1_model.objects.create(spatial='POLYGON((1000000 120000, 1000000 90000, 1100000 90000, 1100000 120000, 1000000 120000))', column1='Som Chai', column2='Director')
		table1_model.objects.create(spatial='POLYGON((1000000 130000, 1000000 150000, 1100000 150000, 1100000 130000, 1000000 130000))', column1='Som Ying', column2='Employee')
		
		table2 = TableDescriptor.objects.create(project=project, name='Table 2', class_name='db_table2', spatial_type=1, created_by=first_account)
		
		columns = [
			TableColumnDescriptor.objects.create(table=table2, name='Thing', db_column_name='column1', data_type=TYPE_CHARACTER),
			TableColumnDescriptor.objects.create(table=table2, name='Position', db_column_name='column2', data_type=TYPE_CHARACTER),
		]
		create_db_table(table2, columns)
		
		table2_model = get_table_model(table2)
		table2_model.objects.create(spatial='POINT(1050000.49159 130000.75071)', column1='Model', column2='Above')
		table2_model.objects.create(spatial='POINT(1060000.49159 130000.75071)', column1='Box', column2='Bottom')
		
		table3 = TableDescriptor.objects.create(project=project, name='Table 3', class_name='db_table3', spatial_type=1, created_by=first_account)
		
		columns = [
			TableColumnDescriptor.objects.create(table=table3, name='Name', db_column_name='column1', data_type=TYPE_CHARACTER),
			TableColumnDescriptor.objects.create(table=table3, name='Status', db_column_name='column2', data_type=TYPE_CHARACTER),
		]
		create_db_table(table3, columns)
		
		table3_model = get_table_model(table3)
		table3_model.objects.create(spatial='POINT(1150000.49159 150000.75071)', column1='Person1', column2='Single')
		table3_model.objects.create(spatial='POINT(1360000.49159 160000.75071)', column1='Person2', column2='Married')
		
	
	workspace1, created = Workspace.objects.get_or_create(name='Sample Workspace 1', created_by=first_account)
	
	if created:
		WorkspaceLayer.objects.create(workspace=workspace1, name='Layer for table1', table=table1, is_show=True, ordering=1)
		WorkspaceLayer.objects.create(workspace=workspace1, name='Layer for table2', table=table2, is_show=True, ordering=2)
	"""

from django.db.models.signals import post_syncdb
post_syncdb.connect(after_syncdb, dispatch_uid="domain.management")
