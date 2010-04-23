from django.shortcuts import get_object_or_404

from helper.shortcuts import render_response

from models import Project, TableDescriptor

def view_user_projects(request):
	projects = Project.objects.filter(created_by=request.user)
	
	return render_response(request, 'project/projects.html', {'projects':projects})

def view_user_project_tables(request, project_id):
	project = get_object_or_404(Project, pk=project_id)
	
	tables = TableDescriptor.objects.filter(project=project)
	
	return render_response(request, 'project/project_tables.html', {'project':project, 'tables':tables})

def view_user_project_users(request, project_id):
	pass
	
def view_user_table(request, table_id):
	pass
