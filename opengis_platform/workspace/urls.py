from django.conf.urls.defaults import *

urlpatterns = patterns('workspace.views',
	url(r'^list/$', 'view_workspace_list', name='view_workspace_list'),
	url(r'^(?P<workspace_id>\d+)/$', 'view_workspace', name='view_workspace'),
)

urlpatterns += patterns('workspace.views_ajax',
	url(r'^ajax/layer/data/extjs/$', 'ajax_get_layer_extjs_data', name='ajax_get_layer_extjs_data'),
	url(r'^ajax/layers/map/$', 'ajax_get_layers_map_data', name='ajax_get_layers_map_data'),
)