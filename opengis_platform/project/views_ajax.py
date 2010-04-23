from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.utils import simplejson

from accounts.models import UserProject
from project.models import TableDescriptor

@login_required
def ajax_get_user_tables_extjs(request):
	user_projects = UserProject.objects.filter(user=request.user.get_profile())
	
	rows = []
	for user_project in user_projects:
		tables = TableDescriptor.objects.filter(project=user_project.project)
		
		for table in tables:
			rows.append({'id':table.id, 'name':table.name, 'project_name':user_project.project.name})
	
	metadata = {
		'idProperty':'id',
		'root':'rows',
		'sort_info':{'field':'project_name','direction':'ASC'},
		'fields':[
			{'name':'name','type':'string'},
			{'name':'project_name','type':'string'},
		]}
	
	return HttpResponse(simplejson.dumps({'metaData':metadata, 'success':True, 'results':len(rows), 'rows':rows}))
	


