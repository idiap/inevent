from django.test import TestCase
from django.test.client import Client
from inevent.forms import IneventSearchForm
from inevent.ajax import call_inevent_search
from django.core.urlresolvers import reverse
import json
import requests
from django.test.client import RequestFactory
from dajaxice.core import dajaxice_functions
import pprint

class Ajax_view_TestCase(TestCase):

 #     def verify_exclusion(self, returned_list, provider):
#         for item in returned_list:
#             type = item['providerName']
#             if (type!=provider): # string label
#                 return False
#         return True

     def test_search_request(self):
        # mutually exclusive choices
        choices = [(0, 'Everywhere'),(1, 'Klewel'), (2, 'Scopia'), (3, 'TED')]
        headers = {'content-type': 'application/json'}
        for choice in choices:
            post_data = {'searchable': choice[0], 'keywords':'cool'}
            request = RequestFactory().get('/')
            # another option to call the method would be: from manage.ajax import call_inevent_search
            # then call call_inevent_search[0] is added because call_inevent_search has been modified by dajaxice
            response = dajaxice_functions.get('inevent.call_inevent_search').call(request, post_data, '1')
           #  pp = pprint.PrettyPrinter(depth=6)
            self.assertTrue(response) # to be changed

