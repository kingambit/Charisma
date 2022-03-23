#!/usr/bin/env/python3
# -*- coding: utf-8 -*-
"""
Created on Mon April 26 11:43:30 2021

@author: rtorlapati@genexsystems.com
"""


import sys
from readgssi import readgssi
import os
from bs4 import BeautifulSoup
import xmltodict
import os
import json
import numpy
import time


class FileInputError(Exception):
    def __init__(self, files, message="All the files mentioned in the XML file are not present. Please try again"):
        self.files = files
        self.message = message
        super().__init__(self.message)


def xmltoJson(List,time_string):

    for file in List:
        with open(file,"r+") as xml_file:
            try:# XML structure 1
                soup = BeautifulSoup(xml_file.read(),"xml")
                data_dict = xmltodict.parse(str(soup))
                xml_file.close() #XML to python dictionary
            except:# XML structure 2
                data_dict = xmltodict.parse(xml_file.read())
                xml_file.close()   #XML to python dictionary
        
        filesfromxml = []
        filelistfromxml = [] 
        for i in range(0, len(data_dict['GPR']['GPR-Readings'])):
            for key, value in data_dict['GPR']['GPR-Readings'][i].items():
                filesfromxml.append(value) 
        for file in filesfromxml:
            head, tail = os.path.split(file)
            filelistfromxml.append(tail) #getting list of DZT files pointed in the XML file

        lst = []
        print("The following files are required:", filelistfromxml) #let the user know the required files
        while filelistfromxml != lst:
            filee = input("Upload the files :")
            if (filee in filelistfromxml and filee not in lst):#check if the user is uploading only the require files
                lst.append(filee)
                print("valid file upload")
            else:
                print("Please upload only the required files")
        rows = []
        columns = []
        for file in lst:
            hdr, arrs, gps = readgssi.readgssi(file)
            rows.append(len(arrs[0]))
            columns.append(len(arrs[0][1]))

        jsondump = []
        for file in sorted(lst):
            time = list(numpy.linspace(0.015625,8,max(rows))) #time value for JSON file
            hdr, arrs, gps = readgssi.readgssi(file)# reading DZT files and converting it to required JSON Schema
            length = len(arrs[0])
            width = len(arrs[0][1])
            meanval = int(arrs[0].flatten().mean())
            Data = arrs[0].tolist()
            for i in range(0,len(Data)):
                while len(Data[i]) != max(columns):
                    Data[i].append(meanval)
            content = []
            for t, d in zip(time, Data):
                temp = { 'Time': t, 'AmplitudeArray': d }
                content.append(temp)

            jsonStr = json.dumps(content)
            jsondump.append(jsonStr)

        content = []
        for n, d in zip(filesfromxml, jsondump):
            temp = { 'GPRFileName': n, 'GPRFileData': d }
            content.append(temp)
        
        jsonData = json.dumps(content, indent = 4)

        DataDumpFileName = "Data"+time_string+".json"
        with open(DataDumpFileName, "w") as json_file:
            json_file.write(jsonData)#writing to JSON file with same name
            json_file.close()


        sttr = '<GPRDataFileName>'+DataDumpFileName+'</GPRDataFileName>'
        temp  = xmltodict.parse(sttr)
        data_dict['GPR']['GPR-Readings'] = temp

        jsonHeader = json.dumps(data_dict, indent = 4)
               
        HeaderFileName = "Header"+time_string+".json"
        with open(HeaderFileName, "w") as json_file:
            json_file.write(jsonHeader)
            json_file.close() #writing into a json file with same name"""

    
if __name__ == "__main__":
    files = sys.argv[1:]

    xmlfiles = []
    
    named_tuple = time.localtime()
    time_string = time.strftime("%m%d%Y%H%M%S", named_tuple)

    for file in files:
        if file.endswith((".xml",".XML")):
            xmlfiles.append(file)

    xmltoJson(xmlfiles,time_string)