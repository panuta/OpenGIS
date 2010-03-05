from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404

from models import *

from helper.shortcuts import render_response

@login_required
def view_workspace_list(request):
	workspaces = Workspace.objects.filter(created_by=request.user.get_profile())
	return render_response(request, 'workspace/workspace_list.html', {'workspaces':workspaces})

@login_required
def view_workspace(request, workspace_id):
	workspace = get_object_or_404(Workspace, pk=workspace_id)
	
	return render_response(request, 'workspace/workspace_view.html', {'workspace':workspace})
	