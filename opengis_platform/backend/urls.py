from django.conf.urls.defaults import *

urlpatterns = patterns('backend.views',
	url(r'^table/(?P<table_id>\d+)/data/$', 'view_table_data_page', name='view_table_data_page'),
	
	
	url(r'^testing/$', 'view_testing_page', name='view_testing_page'),
)
