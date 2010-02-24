# -*- encoding: utf-8 -*-

from django.shortcuts import get_object_or_404, redirect

from domain.models import *

from helper.shortcuts import render_response

def view_table_data_page(request, table_id):
	#table_descriptor = get_object_or_404(TableDescriptor, pk=table_id)
	#return render_response(request, 'backend/table_data_page.html', {'table_descriptor':table_descriptor})
	
	return render_response(request, 'backend/table_data_page.html', {})

def view_testing_page(request):
	
	return render_response(request, 'testing.html', {})