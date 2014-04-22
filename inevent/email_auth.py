from django.contrib.auth.models import User
from django.core.validators import email_re

class BasicBackend:
    
    supports_object_permissions = False
    supports_anonymous_user = False
    supports_inactive_user = False
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

class EmailBackend(BasicBackend):
    def authenticate(self, username=None, password=None):
        #If username is an email address, then try to pull it up
        if email_re.search(username): #@UndefinedVariable
            try:
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                return None
        else:
            #We have a non-email address username we should try username
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None
        if user.check_password(password):
            return user

from django import forms
from django.contrib.auth.forms import AuthenticationForm

class MyAuthenticationForm(AuthenticationForm):
    username = forms.CharField(label="Email address", max_length=75)