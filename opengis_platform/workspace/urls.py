from django.conf.urls.defaults import *

urlpatterns = patterns('workspace.views',
	url(r'^my/workspaces/$', 'view_user_workspaces', name='view_user_workspaces'),
	url(r'^my/workspace/(?P<workspace_id>\d+)/$', 'view_user_workspace', name='view_user_workspace'),
)

urlpatterns += patterns('workspace.views_ajax',
	
	# Add Table Layer
	url(r'^ajax/workspace/get-adding-tables/$', 'ajax_get_adding_tables', name='ajax_get_adding_tables'),
	url(r'^ajax/workspace/add-table-layer/$', 'ajax_add_table_layer', name='ajax_add_table_layer'),
	
	# Layer Information
	url(r'^ajax/workspace/get-layer-schema/$', 'ajax_get_layer_schema', name='ajax_get_layer_schema'),
	url(r'^ajax/workspace/get-layer-data/$', 'ajax_get_layer_data', name='ajax_get_layer_data'),
	url(r'^ajax/workspace/get-layer-spatial-data/$', 'ajax_get_layer_spatial_data', name='ajax_get_layer_spatial_data'),
	
	url(r'^ajax/workspace/rename-layer/$', 'ajax_rename_layer', name='ajax_rename_layer'),
	url(r'^ajax/workspace/delete-layer/$', 'ajax_delete_layer', name='ajax_delete_layer'),
	
	url(r'^ajax/workspace/insert-layer-row/$', 'ajax_insert_layer_row', name='ajax_insert_layer_row'),
	url(r'^ajax/workspace/update-layer-row/$', 'ajax_update_layer_row', name='ajax_update_layer_row'),
	url(r'^ajax/workspace/update-layer-row-spatial/$', 'ajax_update_layer_row_spatial', name='ajax_update_layer_row_spatial'),
	url(r'^ajax/workspace/delete-layer-row/$', 'ajax_delete_layer_row', name='ajax_delete_layer_row'),
	
)