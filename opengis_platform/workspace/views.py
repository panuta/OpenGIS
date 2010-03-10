from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import simplejson

from models import *

from domain.models import TableColumnDescriptor

from helper.shortcuts import render_response
from helper.utilities import change_to_extjs_field_type, serialize_spacial

@login_required
def view_workspace_list(request):
	workspaces = Workspace.objects.filter(created_by=request.user.get_profile())
	return render_response(request, 'workspace/workspace_list.html', {'workspaces':workspaces})

@login_required
def view_workspace(request, workspace_id):
	workspace = get_object_or_404(Workspace, pk=workspace_id)
	
	layers = WorkspaceLayer.objects.filter(workspace=workspace).order_by('ordering')
	
	return render_response(request, 'workspace/workspace_view.html', {'workspace':workspace, 'layers':layers})
	


	