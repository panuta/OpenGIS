from django.conf.urls.defaults import *

urlpatterns = patterns('domain.views',
	url(r'^ajax/table/(?P<table_id>\d+)/data/$', 'ajax_load_table_data', name='ajax_load_table_data'),
)
