from django.conf.urls.defaults import *

urlpatterns = patterns('workspace.views',
	url(r'^my/workspaces/$', 'view_user_workspaces', name='view_user_workspaces'),
	url(r'^my/workspace/(?P<workspace_id>\d+)/$', 'view_user_workspace', name='view_user_workspace'),
)

urlpatterns += patterns('workspace.views_ajax',
	# Get table list for adding a new layer
	url(r'^ajax/workspace/get-adding-tables/$', 'ajax_get_adding_tables', name='ajax_get_adding_tables'),
	url(r'^ajax/workspace/add-table-layer/$', 'ajax_add_table_layer', name='ajax_add_table_layer'),
	
	url(r'^ajax/workspace/get-layer-schema/$', 'ajax_get_layer_schema', name='ajax_get_layer_schema'),
	url(r'^ajax/workspace/get-layer-data/$', 'ajax_get_layer_data', name='ajax_get_layer_data'),
	
	url(r'^ajax/workspace/insert-layer-data/$', 'ajax_insert_layer_data', name='ajax_insert_layer_data'),
	url(r'^ajax/workspace/save-layer-geo-data/$', 'ajax_save_layer_geo_data', name='ajax_save_layer_geo_data'),
	
	
	
	
	
	
	url(r'^ajax/workspace/get-layer-row-structure/$', 'ajax_get_layer_row_structure', name='ajax_get_layer_row_structure'),
	url(r'^ajax/workspace/get-layer-row-data/$', 'ajax_get_layer_row_data', name='ajax_get_layer_row_data'),
	
	url(r'^ajax/workspace/get-table-spatial-data/$', 'ajax_get_table_spatial_data', name='ajax_get_table_spatial_data'),
	url(r'^ajax/workspace/get-table-data-extjs/$', 'ajax_get_table_data_extjs', name='ajax_get_table_data_extjs'),
)