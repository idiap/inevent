import json
import datetime
import requests
import calendar

rest_base_url = "http://inevent.haifa.il.ibm.com/rest/"
rest_url_retrieval = rest_base_url + "retrieval/"
rest_url_user = rest_base_url + "user/"
rest_url_management = rest_base_url + "archiving/"


def get_similar_events(event_id, limit=5):
    return get_inEvent_data("findSimilarHyperEvents?hyperEventId="+str(event_id), json.dumps({"firstResult":0, "maxResults":limit}))
#                     , "orderBy":"DATE", "asc":"false"}

    
def parse_hyperevent(event, only_basic_info, include_recommendation = False):
    hyperevent = {}
    for key in event.iterkeys():
    #                   title field looks like 'talk_150' so not needed..  
    #                   if (key=='title'): 
    #                         title = event['title']
        #    name field contains the actual recording title
#         if (key=='duration'):
#             hyperevent['duration'] = event['duration']
        if (key == 'description' and only_basic_info == False):
            hyperevent['description'] = event['description']
        elif(key=='id'):
            hyperevent['id'] = event['id'] 
        elif (key == "links" and include_recommendation == True and event['id']):
            recommended_events = event["links"]  
            recommendations = [] 
            for recommended_event in recommended_events:
#                 print recommended_event
#                 {u'confidence': 0.0, u'linkedEvent': None, u'parentId': 1261, u'relevance': 0.9651, u'type': None, u'id': 34031}
                 linked_id = recommended_event['id']
                 if (linked_id!=event['id']):
                     re = {}
                     re['event'] = get_event(linked_id, False) 
                     re['relevance'] = recommended_event['relevance']
                     recommendations.append(re)
            hyperevent['similar_events'] =  recommendations           
        elif (key=='date' and event['date']!=None):                     
#            somehow digits sent are more than expected and without dividing by 100, it's out of range
             
             hyperevent['date'] = datetime.datetime.fromtimestamp(int(event['date'])/1000)
             hyperevent['date_ms'] = event['date']
        elif (key=='tags'):
            cleaned_tags = ''
            tags = event['tags']
            if (tags and tags[0].has_key('value')):
                for tag in tags:
                    cleaned_tags = tag['value'] + " "   # .strip("\n")
                hyperevent['tags'] = cleaned_tags
        elif (key=='name'):
             hyperevent['title'] = event['name']
             #  hack to remove presenter name from presentation title
    #                         hyperevent['title'] = event['name'].split(":")[1]   
        elif (key=='participations'): # Get Lecturer
            participants = event['participations'] 
            presenters = []
            if len(participants) > 3:
                participants = participants[0:3]
            for participant in participants:
                display_name = participant['participant']['displayName'].replace("+", " ")
                presenters.append(display_name)
    #                           if (first_participant and first_participant.has_key('role') and first_participant['role']=='LECTURER' and first_participant['participant'])
            hyperevent['presenters'] = presenters
        elif(key=='mediaProvider' and event[key]['name']!=None):
#            print event[key]
            hyperevent['providerName']  = event[key]['name']
        elif (key == 'tracks'):  # Video, slides, and snapshot
            tracks = event[key]
            for track in tracks:
                files = track['files']
                if (track['mimeType']=="inevent/video"):
                    for file in files:
                        if(file['mimeType'].rfind('image')!=-1): # Get Snapshot
                            hyperevent['snapshot_url'] = rest_url_retrieval +  "getTrackFile/"+file['fileName']+"?trackId="+str(file['trackId'])
#                            print hyperevent['snapshot_url']
                        elif (file['mimeType'].rfind('video')!=-1):
                            hyperevent['video_url'] =  rest_url_retrieval + "getTrackFile/"+file['fileName']+"?trackId="+str(file['trackId'])
                            hyperevent['mime_type'] = file['mimeType']      
#                     hyperevent['duration'] =  track['duration']
                elif (track['mimeType']=="inevent/slides" and only_basic_info == False):
    #                               print "slide"
                    hyperevent['num_slides'] = len(files)
                    slides = []
                    for file in files:
                        if file['fileName'] is None:
                            continue
                        url = rest_url_retrieval + "getTrackFile/"+file['fileName']+"?trackId="+str(file['trackId'])
                        startTime = file['startTime']
                        slides.append({'slide_url':url, 'startTime': startTime}) 
                    hyperevent['slides'] = slides       

                elif(track['mimeType']=='inevent/transcript' and only_basic_info == False):

                    if (len(files) > 0):
                        file = files[0]
                        url =   rest_url_retrieval + "getTrackFile/"+file['fileName']+"?trackId="+str(file['trackId'])                    
                        hyperevent['transcript_url'] = url
                        #=======================================================
                        # print event['id']
                        # print url
                        #=======================================================

#                    
#
#   

    return hyperevent   

def to_lower(s):
   if len(s) == 0:
      return s
   else:
#      return s[0] + s[1:].lower()
      return s.lower()

def example_hyperevent():
    hyperevent = {}
    hyperevent['title'] = 'Hello'
    hyperevent['providerName']='Klewel'
    hyperevent['video_url']=  rest_url_retrieval + "getTrackFile/SarahKay_2011-480p.mp4?trackId=73"
    clean_entries = []
    hyperevent['transcript_exists'] = True
    clean_entries.append({'startTime': 123412421, 'displayName':'who cares', 'value': 'salut salut salut'})
    hyperevent['transcripts'] = clean_entries
    hyperevent['snapshot_url'] = rest_url_retrieval + "getTrackFile/snapshot.jpg?trackId=1058"
    return hyperevent 

def get_event(id, only_basic_info=True, graph_mode=False, raw_data=False):
    url = "getHyperEvent?hyperEventId="+str(id)
    event = get_inEvent_data(url)
    if raw_data:
        return event
    else:
        return parse_hyperevent(event, only_basic_info, graph_mode)

def get_some_events(num, only_basic_info = False, graph_mode=False, search_query=None):
    final_search_query = {
        "firstResult": 0,
        "maxResults": num,
        "orderBy": "DATE",
        "asc": "false"
    }
    if search_query:
        final_search_query.update(search_query)

    data = get_inEvent_data("searchHyperEvents?",json.dumps(final_search_query))
    
    if data.has_key('hyperEvents'):
        return {'hyperevents':parse_hyperevents(data['hyperEvents'][0:num],only_basic_info,graph_mode)}
    else:
        return data
   
def get_most_recent_events(num, only_basic_info=False, graph_mode=False):
    return get_some_events(num, only_basic_info, graph_mode, None)
                    
def parse_hyperevents(events, only_basic_info = False, with_recommendations = False):
    parsed_events = []
    for event in events:
        relevance = None
        if event.has_key('relevance'):
            relevance = event['relevance']
        if event.has_key('linkedEvent'):
            event = event['linkedEvent']
        hyperevent = parse_hyperevent(event, only_basic_info, with_recommendations)
        if relevance is not None:
            hyperevent.update({'relevance':relevance})
        parsed_events.append(hyperevent)   
#    print parsed_events[0]    
    return parsed_events                     

def get_inEvent_data(url, post_data = None, rest_base = rest_url_retrieval):
    headers = {'content-type': 'application/json'}
    url = rest_base  + url
    try:
        if post_data:
            response = requests.post(url, data = post_data, headers = headers)
        else:
            response = requests.get(url, headers = headers)    
        if response.status_code / 100 == 2:
            if len(response.content) == 0:
                return {}
            else:
                return json.loads(response.content)
        else:
            return {'error': response.status_code, 'content': response.content}
    except:
        return {'error':'could not get data'}     

def check_user_login(login, password):
    url = 'login?login=%s&password=%s' % (login, password)
    return get_inEvent_data(url, post_data = None, rest_base = rest_url_user)


def do_user_register(user_info):
    url = 'createUser'
    result = get_inEvent_data(url, post_data=json.dumps(user_info), rest_base=rest_url_user)
    if not result.has_key('error'):
        result['login'] = user_info['login']
    elif result['error'] == 409:
        result['content'] = result['content'] + ' already exists'
    else:
        result['content'] = result['content'] + '(code: %d)' % result['error']
    return result

def do_update_hyperevent(new_data):
    url = 'updateHyperEvent'
    result = get_inEvent_data(url, post_data=json.dumps(new_data), rest_base=rest_url_management)
    return result
