from django.conf import settings
from django.shortcuts import redirect

from helper.shortcuts import render_response

def view_homepage(request):
	if request.user.is_authenticated():
		return redirect(settings.LOGIN_REDIRECT_URL)
	
	return render_response(request, 'homepage.html', {})