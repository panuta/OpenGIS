from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import simplejson

from models import *

from project.models import TableColumnDescriptor

from helper.shortcuts import render_response

@login_required
def view_user_workspaces(request):
	workspaces = Workspace.objects.filter(created_by=request.user.get_profile())
	return render_response(request, 'workspace/workspaces.html', {'workspaces':workspaces})

@login_required
def view_user_workspace(request, workspace_id):
	workspace = get_object_or_404(Workspace, pk=workspace_id)
	
	layers = WorkspaceLayer.objects.filter(workspace=workspace).order_by('ordering')
	
	from helper.constants import SPATIAL_TYPE_STRING
	
	for layer in layers:
		layer.spatial_type = SPATIAL_TYPE_STRING[layer.table.spatial_type]
	
	return render_response(request, 'workspace/workspace_view.html', {'workspace':workspace, 'layers':layers})
	


	