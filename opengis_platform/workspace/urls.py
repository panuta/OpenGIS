from django.conf.urls.defaults import *

urlpatterns = patterns('workspace.views',
	url(r'^list/$', 'view_workspace_list', name='view_workspace_list'),
	url(r'^(?P<workspace_id>\d+)/$', 'view_workspace', name='view_workspace'),
)

