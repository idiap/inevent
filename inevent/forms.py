from django import forms 

class IneventSearchForm(forms.Form):
    searchable = forms.ChoiceField(choices = (), required = False);
    q = forms.RegexField(regex=r'^[a-zA-Z0-9-_ ]+$', min_length=2, required = False);
    #keywords = forms.RegexField(regex=r'^[a-zA-Z0-9-_ ]+$', min_length=2,required='true');
    speaker = forms.CharField(max_length=100, required = False)
    title = forms.CharField(max_length=100, required = False)
    start_date = forms.DateField(required = False)
    end_date = forms.DateField(required = False)
    def __init__(self, *args, **kwargs):
        if  kwargs.has_key('choices'):
            choices = kwargs.pop('choices')
            super(IneventSearchForm, self).__init__(*args, **kwargs)
            self.fields['searchable'].choices = choices;