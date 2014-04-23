import json
import os
import sys
from django.conf import settings 
import numpy as np
import pickle
from collections import defaultdict
from random import shuffle
from pyPdf import PdfFileReader
from django.shortcuts import render_to_response
from django.template import RequestContext

def get_segmented_videos (request, central_video_input_id = 4, chosen_segment_id = 0):

    all_videos = json.loads(open(settings.SERVER_PATH + "acm/data/acm_data.json").read())
    nodes = []
    segment_id_converter = {}
    segment_start_time = {}
    
    links = []
#    central...change central point
#    image check
#    central video links
#append node id only? as children and not all object
#remove_count..
    
    chosen_start_time = 0
    central_video_size = 100
    central_video_radius = central_video_size
    central_video_group = 1

    peripheral_video_size = central_video_size /2
    peripheral_video_radius = peripheral_video_size
    peripheral_video_group = 2
    #===========================================================================
    # cloud_size = [650/2.5,330/2.5]
    #cloud_size_video = [float(650)/2,float(330)/2]
    #cloud_size_central_video = [float(650)/1.5,float(330)/1.5]
    
    #===========================================================================
    
    
    cloud_size = [720/4,580/4]
    cloud_size_video = [float(720)/3.25,float(580)/3.25]
    cloud_size_central_video = [float(720)/3,float(580)/3]
    
    
    
    image_ratio = [float(7)/7,float(7)*580/(7*720)]
    image_ratio_segment = [float(7)/10,float(7)*580/(10*720)]
    

    central_segment_size = 60
    segment_group = 3
    peripheral_segment_size = 30
    central_segment_group = 4
    
    all_slides_per_video = {}
    titles = {}


    video_id_converter = {}
    segment_to_video = {}
    segments_data = {}
    central_video = all_videos[0]
    index = 0
    
    video_duration = {}
    duration = 0
    
    for video in all_videos:
        duration = 0
        video_id = video['video_id']
        all_slides_per_video[video_id] = extract_slides(video['thumbnail'].split("/")[1])
        
        titles[video_id] = extract_title(video['thumbnail'].split("/")[1])

        if (central_video_input_id!=None and video_id == int(central_video_input_id)):
            central_video =  video
        video_segments = video['video_segments']
        
        for segment_index in range(0, len(video_segments)):
            segment = video_segments[segment_index]
        
            segment_id = segment['segment_id']
            
        
            segment_to_video.update({str(segment_id):index})
            segments_data.update({str(segment_id):segment})
            
            duration_size = segment['segment_duration_size']
            duration += duration_size
            if segment_index == 0:
                segment_start_time[segment_id] = 0
            else:
                previous_segment = video_segments[segment_index-1]
                segment_start_time[segment_id] = previous_segment['segment_duration_size'] + segment_start_time[previous_segment['segment_id']]

                #compare to the segment_index not the segment_id because the scope of segment_ids are distributed across videos
                if (video_id == int(central_video_input_id) and segment_index-1 == int(chosen_segment_id)):
                    chosen_start_time = segment_start_time[segment_id]
            
    
        video_duration[video_id]=duration
        index = index + 1    
            
    
    video_id = central_video['video_id']
    
 
    #Open  file  videos_urls.txt that maps video ids to urls 
    video_urls={}
    
    

    url_file = open(settings.SERVER_PATH + "acm/data/videos_urls.txt", "r")
    for column,video_url in enumerate ( raw.strip().split() for raw in url_file ): 
        video_="video_"+str(column)
        video_urls[video_]=video_url[2]
    
    video_links = central_video['video_link_ids']
    


    central_video_node_id = len(nodes)
#    add central node:
    
#print central_video['thumbnail']

    nodes.append({"group":central_video_group, 
                  "url":video_urls['video_'+str(video_id)], 
                  "size": central_video_size, 
                  "radius": central_video_radius,  
                  "id": central_video_node_id, 
                  "image_width": central_video_size * image_ratio[0],
                  "image_height":central_video_size * image_ratio[1], 
                  "cloud_width": cloud_size_central_video[0], 
                  "cloud_height": cloud_size_central_video[1], 
                  "word_cloud":"acm/media/"+str(central_video['word_cloud']), 
                  "snapshot":"acm/media/"+ str(central_video['thumbnail']).split("/")[0]+"/"+str(central_video['thumbnail']).split("/")[1]+"/thumbnail_8.jpg",
                  "slides":all_slides_per_video[video_id],
                  "name":"video"+ str(video_id),
                  "title":titles[video_id],
                  "duration":video_duration[video_id]})



    video_id_converter.update({""+str(video_id):central_video_node_id})
#    load central video segments then load related segments
    response = add_video_segments(central_video, central_video_node_id, central_segment_group, central_segment_size, central_video['video_segments'], nodes, segment_id_converter,cloud_size, image_ratio_segment,segment_start_time)
    nodes = response[0]
    segment_id_converter = response[1]
    
###add  related videos
    for video in all_videos:
        if video['video_id'] in video_links:
#            print "added " +  str(video['video_id'])
            video_node_id = len(nodes)
            nodes.append({"duration":video_duration[video['video_id']], "title":titles[video['video_id']],"slides":all_slides_per_video[video['video_id']], "id": video_node_id, 'url':video_urls['video_'+str(video['video_id'])], "group":peripheral_video_group, "image_width": peripheral_video_size * image_ratio[0], "image_height":peripheral_video_size * image_ratio[1], "size": peripheral_video_size, "radius": peripheral_video_radius, "cloud_width": cloud_size_video[0], "cloud_height": cloud_size_video[1], "word_cloud":"acm/media/"+str(video['word_cloud']) , "snapshot":"acm/media/"+str(video['thumbnail']).split("/")[0]+"/"+str(video['thumbnail']).split("/")[1]+"/thumbnail_8.jpg", "name":"video"+ str(video['video_id'])})
            video_id_converter.update({""+str(video['video_id']):video_node_id})
            response = add_video_segments(video, video_node_id, segment_group, peripheral_segment_size, video['video_segments'], nodes, segment_id_converter, cloud_size, image_ratio_segment,segment_start_time)
            nodes = response[0]
            segment_id_converter = response[1]
            links.append({"source":central_video_node_id,"target":video_node_id,"value":1, "group":"1"})

#            
    
#    load central video segments then load related segments
    segments = central_video['video_segments']
    for segment in segments:
#        print segment['segment_id']
        related_segments_ids = segment['segment_record_id']
#        print related_segments_ids
        source_segment_node_id = segment_id_converter[""+segment['segment_id']]
#        print "source_segment" + str(source_segment_node_id) + " original " + str(segment['segment_id']) + "parent " + str(central_video['video_id'])
        
        for related_segment_id in related_segments_ids:
            related_segment = segments_data[str(related_segment_id)]
            
            if (segment_id_converter.has_key(str(related_segment_id)) == False):
#                print "ENTERED for " + str(related_segment_id)
                related_segment_node_id = len(nodes)
                child_node = {"group":segment_group, "size": peripheral_segment_size, "id":    related_segment_node_id, "image_width":  peripheral_segment_size * image_ratio_segment[0], "image_height": peripheral_segment_size * image_ratio_segment[1], "cloud_width": cloud_size[0], "cloud_height": cloud_size[1],"word_cloud":"acm/media"+str(related_segment['word_cloud']) , "snapshot":"acm/media/"+str(related_segment['thumbnail']), "name":"segment"+str(related_segment_id)}
                child_node.update({'start_time': segment_start_time[related_segment_id]})
                child_node.update({'duration': related_segment['segment_duration_size']})
                nodes.append(child_node)
                segment_id_converter.update({""+str(related_segment_id):related_segment_node_id})

                parent_index_in_json_file = segment_to_video[""+str(related_segment_id)]
                parent = all_videos[parent_index_in_json_file]
                parent_id = parent['video_id']
#                print "parent_id "+str(parent_id) + "for " + str(related_segment_id)
                parent_node = {"group":peripheral_video_group, "size": peripheral_video_size, "radius": peripheral_video_radius, "image_width": peripheral_video_size * image_ratio[0], "image_height":peripheral_video_size * image_ratio[1], "cloud_width": cloud_size[0], "cloud_height": cloud_size[1], "word_cloud":"acm/media"+str(parent['word_cloud']), "snapshot":"acm/media/"+ str(parent['thumbnail']).split("/")[0]+"/"+str(parent['thumbnail']).split("/")[1]+"/thumbnail_8.jpg", "name":"video"+ str(parent['video_id'])}
                
                if video_id_converter.has_key(str(parent_id)) == True:
                    parent_node_id = video_id_converter[str(parent_id)]    
                    # update child segment with actual parent_id
                    nodes[related_segment_node_id].update({'parent':parent_node_id})
#                    add reference to child for parent video
                    nodes[parent_node_id]['children'].append(child_node)
                else:# parent node not yet added
#                    print "adding parent for first time"  +str(parent_id)
#                    print "first time" + str(unique_id) + " " + parent_index_in_json_file
                     parent_node_id = len(nodes)
                     parent_node.update({'children':[child_node]})
                     parent_node.update({'id':parent_node_id})
                     parent_node.update({'url':video_urls['video_'+str(parent_id)]})
                     parent_node.update({"slides":all_slides_per_video[video['video_id']]})
                     parent_node.update({"title":titles[video['video_id']]})
                     parent_node.update({"duration":video_duration[video['video_id']]})
                     nodes.append(parent_node)
#                      update child node with actual parent_id
                     nodes[related_segment_node_id].update({'parent':parent_node_id})
                     video_id_converter.update({""+ str(parent['video_id']):parent_node_id})
#                    links.append({"source":related_segment_node_id,"target":parent_node_id,"value":1, "group":"3"})

            
#                    add other video segments
                     other_segments = parent['video_segments']
                     first_segment = True
#                    print len(other_segments)
                     for peripheral_segment in other_segments:
                        peripheral_segment_id = peripheral_segment['segment_id']
                        if (segment_id_converter.has_key(str(peripheral_segment_id)) == False):
#                            print "adding peripheral segments" + peripheral_segment_id
                            peripheral_segment_node_id = len(nodes)
                            new_node = {"group":segment_group, "size": peripheral_segment_size, "image_width":  peripheral_segment_size * image_ratio_segment[0], "image_height":  peripheral_segment_size * image_ratio_segment[1], "parent": parent_node_id, "id":peripheral_segment_node_id, "cloud_width": cloud_size[0], "cloud_height": cloud_size[1],"word_cloud":"acm/media/"+str(peripheral_segment['word_cloud']), "snapshot":"acm/media/"+str(peripheral_segment['thumbnail']), "name":"segment"+str(peripheral_segment_id)}
                            child_node.update({'start_time': segment_start_time[peripheral_segment_id]})
                            child_node.update({'duration': peripheral_segment['segment_duration_size']})
                            nodes[parent_node_id]['children'].append(new_node)
                            nodes.append(new_node)
                            segment_id_converter.update({""+str(peripheral_segment_id):peripheral_segment_node_id})                
            else:
#                segment already exists in the nodes list
                related_segment_node_id = segment_id_converter[str(related_segment_id)]
#            print "segments connection" + str(source_segment_node_id) + " " + str(related_segment_node_id)
#            print "related_segment_id" + str(related_segment_id)
            links.append({"source":source_segment_node_id ,"target":related_segment_node_id,"value":1, "group":"2"})

    graph_data = {"nodes":nodes, "links":links}
    data = {'graph':graph_data, "start_time":chosen_start_time}
    template = 'acm/graph.html'
    return render_to_response(template, data, context_instance=RequestContext(request))

def add_video_segments(video, video_node_id, segment_group, segment_size, segments, nodes, segment_id_converter, cloud_size, image_ratio,segment_start_time):

    first_segment = True
    for segment in segments:
#        new_node = {"group":"4", "size": 200, "id":unique_id,"name":"fake"+str(unique_id), "snapshot":"http://datacloud.klewel.com/portal/rushes/XUQxzovs44PorExVp2RG66/snapshots/snapshot0_original.jpg"}
#        nodes.append(new_node)
#        links.append({"source":new_node['id'],"target":unique_id,"value":1,"group":"3"})
#        links.append({"source":new_node['id'],"target":current_video_id,"value":1,"group":"3"})
#        unique_id = unique_id + 1
        segment_id = segment['segment_id']
#        print "segment " + str(segment_id) + "for parent node " + str(video['video_id']) 
        test = float (segment_size * image_ratio[1])

        segment_id_converter.update({""+str(segment_id):len(nodes)})
        new_node = {"group":segment_group, "size": segment_size, "image_width": segment_size * image_ratio[0], "image_height":  segment_size * image_ratio[1], "parent": video_node_id, "id":len(nodes), "cloud_width": cloud_size[0], "cloud_height": cloud_size[1], "word_cloud":"acm/media/"+str(segment['word_cloud']), "snapshot":"acm/media/"+str(segment['thumbnail']), "name":"segment"+str(segment_id)}
        new_node.update({'start_time': segment_start_time[segment_id]})
        new_node.update({'duration': segment['segment_duration_size']})
#        first segment to be added
        #in case first segment in the array is not the one with the smallest ids
        if first_segment == True:
#            if int(segment['segment_id']) == int(video['video_seg_id_range'][0]): 
            nodes[video_node_id].update({'children':[new_node]})
            first_segment = False
        else:
            nodes[video_node_id]['children'].append(new_node)
        nodes.append(new_node)    
    return [nodes, segment_id_converter]

            
def extract_title(folder_name):
    path=settings.SERVER_PATH+"acm/media/om_final_Video_with_slides_with_all_features_Big_segments_20130619/"+folder_name
    if os.path.exists(path)==False:
        path=settings.SERVER_PATH+"acm/media/om_final_Video_with_subtitles_with_all_features_Big_segments_20130619/"+folder_name
        if os.path.exists(path)==False:
            return ""

    for f in os.listdir(path):
        Meta_data_filename = path+'/'+folder_name+"_META_DATA.txt"
        if os.path.exists(Meta_data_filename):
            for line_number, line in enumerate(open(Meta_data_filename,'r')):
                if line_number == 0:
                    talkTitle = line.rstrip('\n')
            return talkTitle;
        else: 
            print 'File not exist----------------------------Breaking-----------------------' + Meta_data_filename
            return ""                     
            

def extract_slides(folder_name):
    words = "author: published: views: Categories Description Slides"
    word_set = set(words.split())
    path=settings.SERVER_PATH+"acm/media/om_final_Video_with_slides_with_all_features_Big_segments_20130619/"+folder_name
    if os.path.exists(path)==False:
        print 'Video has no slides, folder does not exist ----------------------------Breaking-----------------------' + path
        return []
    for f in os.listdir(path):
          Meta_data_filename = path+'/'+folder_name+"_META_DATA.txt"
          if os.path.exists(Meta_data_filename):
        #    print 'processing ' + Meta_data_filename + '...'
        #    print "READING " + str(Meta_data_filename)
        #    print "-"*100
            Slid_flg_start = False
            collected_slid_lines = []
            Video_Slides = {}
            labels_collected_slid_lines = ["slide_start_time", "slide_title"]   # later we add field 'slide_text' to the ['slide_start_time', 'slide_title'] for ease
            for line_number, line in enumerate(open(Meta_data_filename,'r')):
                #print "Processing line number = %d" % (line_number)
            
                if line_number == 0:
                    talkTitle = line.rstrip('\n')
                    #print "Title = %s" % (talkTitle)
                for matched_word in word_set.intersection(line.split()):
                    if matched_word == "Slides":
                            Slid_flg_start = True
                        #print "started description at line",  line_number
                if Slid_flg_start == True:
                    #print "Reading Slide at line", line_number
                    if line.rstrip()!="Slides":
                        #print line.split(' ',1)
                        #print zip(labels_collected_slid_lines, line.split(' ',1) )

                        slide_hash = dict(zip(labels_collected_slid_lines, line.split(' ',1) ))
                        slide_hash["slide_printout"] = slide_hash["slide_start_time"] 
                        slide_hash["slide_start_time"] = getSec(slide_hash["slide_start_time"])
                        image_path = "acm/media/om_final_Video_with_slides_with_all_features_Big_segments_20130619/"+ folder_name + "/images"
                        slide_hash["image_path"] =  str(image_path + "/slide-%d.png" % len(collected_slid_lines))


                        if os.path.exists(settings.SERVER_PATH+slide_hash["image_path"]):
                            collected_slid_lines.append(slide_hash)
                        #    slide_hash['slide_title'] = slide_hash['slide_title'].replace('\n','')
                        
                    
            


            """        
            #print collected_slid_lines
            input = PdfFileReader(file('acm/media/om_final_Video_with_slides_with_all_features_Big_segments_20130619/kolokviji_ekaykin_drilling/sduqoir3au4ug4gzpj6kd56en7vz3x3c.pdf', "rb"))    
            for counter,page in enumerate(input.pages):    
                if counter < len(collected_slid_lines):
                    print collected_slid_lines[counter]['slide_start_time']
                    collected_slid_lines[counter]['slide_text']= page.extractText().replace('\t',' ').strip()
                    collected_slid_lines[counter]['slide_start_time']= getSec(collected_slid_lines[counter]['slide_start_time'])
            """

            #print collected_slid_lines
        
            return collected_slid_lines
          else: 
            print 'File not exist----------------------------Breaking-----------------------' + Meta_data_filename
            return []
        

def getSec(s):
    l = s.split(':')
    return int(l[0]) * 60 + int(l[1])


