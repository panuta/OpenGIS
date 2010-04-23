from django.conf.urls.defaults import *

urlpatterns = patterns('project.views',
	url(r'^my/projects/$', 'view_user_projects', name='view_user_projects'),
	url(r'^my/project/(?P<project_id>\d+)/$', 'view_user_project_tables', name='view_user_project_tables'),
	url(r'^my/project/(?P<project_id>\d+)/users/$', 'view_user_project_users', name='view_user_project_users'),
	
	url(r'^my/table/(?P<table_id>\d+)/$', 'view_user_table', name='view_user_table'),
	
	url(r'^my/table/(?P<table_id>\d+)/$', 'view_user_table', name='view_user_table'),
)

urlpatterns += patterns('project.views_ajax',
	url(r'^ajax/get-user-tables-extjs/$', 'ajax_get_user_tables_extjs', name='ajax_get_user_tables_extjs'),
	
)