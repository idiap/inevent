from django.http import HttpResponse
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.core.urlresolvers import reverse
import os
import json
from inevent.views.utils import get_event, get_some_events, do_update_hyperevent

SLIDE_ID_IDX = 0
START_TIME_IDX = 1
AUTOMATIC_IDX = 2

def alignment_index(request, hyperevent_id=None):
    data = {}
    hyperevents = get_some_events(
        num=10
        ##search_query={
        ##    'startDate': 1355314332000,
        ##    'endDate': 1355314332000
        ##}
    )
    data['hyperevent_ids'] = []
    for hyperevent in hyperevents.get('hyperevents', []):
        data['hyperevent_ids'].append(hyperevent)

    template = 'inevent/alignment_index.html'
    return render_to_response(template, data, context_instance=RequestContext(request))

def alignment_view(request, hyperevent_id=None):
    data = {}
    if hyperevent_id:
        hyperevent = get_event(hyperevent_id, only_basic_info=False)
        data['hyperevent_id'] = hyperevent_id
        data['hyperevent_title'] = hyperevent['title']
        data['video_url'] = hyperevent['video_url']
        if hyperevent['mime_type'] == 'video/x-flv':
            data['video_type'] = 'flv'
        elif hyperevent['mime_type'] == 'video/mp4':
            data['video_type'] = 'm4v'
        else:
            data['video_type'] = 'PROBLEM'
        data['slides'] = [{'url': slide['slide_url'], 'startTime': slide['startTime'] / 1000}
                          for slide in hyperevent['slides']]
        if len(set ([d['startTime'] for d in data['slides']])) > 1:
            data['slides'].sort(key=lambda slide: slide['startTime'])
        else:
            data['slides'].sort(key=lambda slide: slide['url'])

    template = 'inevent/alignment_view.html'
    return render_to_response(template, data, context_instance=RequestContext(request))

def _is_automatic(slide):
    return slide[AUTOMATIC_IDX] == '1'

def _start_time_of(slide):
    return int(slide[START_TIME_IDX])

def update(request, hyperevent_id):
    new_data = {
        'id': hyperevent_id,
        'title': request.POST['title'],
        'name': request.POST['name'],
        'description': request.POST['description'],
    }
    do_update_hyperevent(new_data)
    return redirect(reverse('alignment_view', args=['']))

def edit(request, hyperevent_id):
    data = {}
    if hyperevent_id:
        data = get_event(hyperevent_id, raw_data=True)

	has_video = 0
	has_slide = 0
	
	for track in data['tracks']:
		if track['mimeType'] == 'inevent/video':
			for file in track['files'] :
				if file['mimeType'][0:5] == 'video':
					has_video = 1
		elif track['mimeType'] == 'inevent/slides':
			has_slide = 1

	data['has_video'] = has_video
	data['has_slide'] = has_slide

    template = 'inevent/edit.html'
    return render_to_response(template, data, context_instance=RequestContext(request))

def align(request, video_id):

    # extract information fron parameters
    info = json.loads(request.body)
    slides = info['slides']
    video_len = info['video_len']
    if video_len == 0:
        # strange...
        video_len = 1

    print 'HELLO', info
    ### PB with TIMESTAMP...
    ###print [s[START_TIME_IDX] for s in slides]
    ###for i in xrange(len(slides)):
    ###    slides[i][START_TIME_IDX] = 0
    ###print [s[START_TIME_IDX] for s in slides]
    if video_len > 0:
        if int(slides[-1][START_TIME_IDX]) == 0:
            print 'SET TO AUTO...'
            for s in slides:
                s[AUTOMATIC_IDX] = '1'
    print 'AFTER', info

    # extract index of manual slides
    manual_slides = []
    for i in range(len(slides)):
        if not _is_automatic(slides[i]):
            manual_slides.append(i)

    # init before going trough all the slides
    results = []
    min_auto_time = 0
    if len(manual_slides) > 0:
        nb_auto_slides = manual_slides[0]
        max_auto_time = _start_time_of(slides[manual_slides[0]])
        current_manual = 0
    else:
        nb_auto_slides = len(slides)
        max_auto_time = video_len
        current_manual = 0
    current_auto = 0

    for i in range(len(slides)):

        # update min/max/nb auto slides if necessary
        if len(manual_slides) > current_manual and manual_slides[current_manual] == i:
            min_auto_time = _start_time_of(slides[manual_slides[current_manual]])
            if len(manual_slides) > (current_manual + 1):
                max_auto_time = _start_time_of(slides[manual_slides[current_manual + 1]])
                nb_auto_slides = manual_slides[current_manual + 1] - manual_slides[current_manual]
            else:
                max_auto_time = video_len
                nb_auto_slides = len(slides) - manual_slides[current_manual]
            current_manual += 1
            current_auto = 0

        # compute start time of the current slide
        slide_id = slides[i][SLIDE_ID_IDX]
        if _is_automatic(slides[i]):
            slide_start_time = min_auto_time + int((max_auto_time - min_auto_time) / nb_auto_slides * current_auto)
        else:
            slide_start_time = slides[i][START_TIME_IDX]

        # prepare the result to send back
        results.append({
            'slide_id': slide_id,
            'slide_start_time': slide_start_time,
            'slide_start_time_mode': slides[i][AUTOMATIC_IDX],
        })

        # go to next slide
        current_auto += 1

    # prepare the full results to return
    results_json = json.dumps({
        'video_id': video_id,
        'video_len': video_len,
        'slides': results,
    })

    return HttpResponse(results_json)
