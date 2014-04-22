#!/usr/bin/python -tt
#coding=utf-8 


import os
import sys
from django.conf import settings 
import numpy as np
import pickle
import json
from collections import defaultdict
from random import shuffle
from pyPdf import PdfFileReader


def extract_title(folder_name):
	path=settings.PROJECT_ROOT+"/static/inevent/images/om_final_Video_with_slides_with_all_features_Big_segments_20130619/"+folder_name
	if os.path.exists(path)==False:
		path=settings.PROJECT_ROOT+"/static/inevent/images/om_final_Video_with_subtitles_with_all_features_Big_segments_20130619/"+folder_name
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
	path=settings.PROJECT_ROOT+"/static/inevent/images/om_final_Video_with_slides_with_all_features_Big_segments_20130619/"+folder_name
	if os.path.exists(path)==False:
		print 'Video has no slides, folder does not exist ----------------------------Breaking-----------------------' + path
		return []
	for f in os.listdir(path):
  		Meta_data_filename = path+'/'+folder_name+"_META_DATA.txt"
  		if os.path.exists(Meta_data_filename):
		#	print 'processing ' + Meta_data_filename + '...'
		#	print "READING " + str(Meta_data_filename)
		#	print "-"*100
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
						image_path = "/static/inevent/images/om_final_Video_with_slides_with_all_features_Big_segments_20130619/"+ folder_name + "/images"
						slide_hash["image_path"] =  str(image_path + "/slide-%d.png" % len(collected_slid_lines))


						if os.path.exists(settings.PROJECT_ROOT+slide_hash["image_path"]):
							collected_slid_lines.append(slide_hash)
						#	slide_hash['slide_title'] = slide_hash['slide_title'].replace('\n','')
						
					
			


			"""		
			#print collected_slid_lines
			input = PdfFileReader(file('/Users/amanda/portal/static/inevent/images/om_final_Video_with_slides_with_all_features_Big_segments_20130619/kolokviji_ekaykin_drilling/sduqoir3au4ug4gzpj6kd56en7vz3x3c.pdf', "rb"))	
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

