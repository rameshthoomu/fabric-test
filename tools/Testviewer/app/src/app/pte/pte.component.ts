import { Component, OnInit, Input, SimpleChanges, SimpleChange, ViewChild } from '@angular/core';
import { serverurl } from '../serveraction';
import { PtechartService } from './ptechart.service'
import { DateselectService } from '../main/dateselect.service'
import { testlists } from '../testlists'

@Component({
  selector: 'app-pte',
  templateUrl: './pte.component.html',
  styleUrls: ['./pte.component.css']
})
export class PTEComponent implements OnInit {
  title = 'PTE Metrics';
  description = 'The Performance Traffic Engine (PTE) uses SDKs to interact with Hyperledger Fabric networks by sending requests to and receiving responses from one or more networks. PTE is designed to handle the complexity of the Hyperledger Fabric network (locations and number of network, number of channels, organizations, peers, orderers etc.) and support various test cases (various chaincodes, transaction number, duration, mode, type, and payload size etc.)'

  //// VARIABLES

  objectkeys = Object.keys
  tests = {};
  test_toadd = testlists.pte.available;
  options = 0;
  buildnum;
  private chosendate;
  selectedOptions;

  //// INPUTS

  @ViewChild("startdateinput") startdateinput;
  @ViewChild("enddateinput") enddateinput;
  @ViewChild("dateinput") dateinput;
  @ViewChild("alertmessage") alertmessage;
  
  //// CHART INFORMATION

  id_invoke_line = 'ptechart_invoke_line';
  id_query_line = 'ptechart_query_line';
  id_invoke_bar = 'ptechart_invoke_bar';
  id_query_bar = 'ptechart_query_bar';
  id_differentialinvoke_line = 'ptechart_diffinvoke_line'
  id_differentialquery_line = 'ptechart_diffquery_line'
  width = "100%";
  height = "600";
  type_line = 'msline';
  dataFormat = 'json';
  dataSource_invoke_line;
  dataSource_query_line;
  dataSource_differentialinvoke_line;
  dataSource_differentialquery_line;
  diameter;
  diameter_day;

  ////

  constructor(private ptechartService: PtechartService, private dateselectService: DateselectService) { }

  addTest(fabnumber) {
    // Creates test object with given fab number

  	this.tests[fabnumber] = {
  		'i':{
  			'fab':null,
        'faburl':null,
  			'totaltime':null,
  			'txnum':null,
  			'tps':null,
        'values':[],
        'stats':{
          'min':null,
          'mean':null,
          'max':null,
          'prange':null
        }
  		},
  		'q':{
  			'fab':null,
  			'totaltime':null,
  			'txnum':null,
  			'tps':null,
        'values':[],
        'stats':{
          'min':null,
          'mean':null,
          'max':null,
          'prange':null
        }
  		}
  	}
  }

  loadTests() {
    this.tests = {}
    for (let test of this.selectedOptions) {
      this.addTest(test);
    }
  }

  updateDate() {
    // Updates single-day data section
    this.diameter_day = 50
    this.dateselectService.updateChosenDate(this.dateinput.nativeElement.value, 'pte')
    .then(obj => {
      this.chosendate = obj.chosendate;
      this.buildnum = obj.build;
      this.getData(obj.build);
    })
    .catch(err => {
      this.diameter_day = 0
      throw err
    })
  }

  getData(build) {
    // Fetches data of all tests from server
  	for (let fabnum of this.selectedOptions) {
  		fetch(`${serverurl}/pte/${fabnum}/${build}` ,{
	       method:'GET',
	     })
       .then(res => res.json())
       .then(res => {
        if (res.success == true) {
          this.tests[fabnum].i.fab = res['invoke']['fab']
          this.tests[fabnum].i.faburl = res['invoke']['fab'].slice(0,-3)
          this.tests[fabnum].i.totaltime = res['invoke']['totaltime'] + " ms"
          this.tests[fabnum].i.txnum = res['invoke']['txnum']
          this.tests[fabnum].i.tps = parseFloat(res['invoke']['tps']).toFixed(2)
          this.tests[fabnum].q.fab = res['query']['fab']
          this.tests[fabnum].q.totaltime = res['query']['totaltime'] + " ms"
          this.tests[fabnum].q.txnum = res['query']['txnum']
          this.tests[fabnum].q.tps = parseFloat(res['query']['tps']).toFixed(2)
        }
        else {
          this.tests[fabnum].i.faburl = null
          this.tests[fabnum].i.totaltime = null
          this.tests[fabnum].i.txnum = null
          this.tests[fabnum].i.tps = null
          this.tests[fabnum].q.totaltime = null
          this.tests[fabnum].q.txnum = null
          this.tests[fabnum].q.tps = null
        }
        this.diameter_day = 0
       })
       .catch(err => {
          this.diameter_day = 0
         	console.log("Logs may not be available yet!");
         	throw err
       })
  	}
  }

  loadCharts(startdate, enddate) {
    if (! this.dateselectService.validateDates(startdate, enddate)) {
      this.alertmessage.nativeElement.innerHTML = "Start date must be earlier than the end date!"
      return
    }
    else {
      this.alertmessage.nativeElement.innerHTML = ""
    }

    // Loads charts with given date range
    this.diameter = 50
    this.ptechartService.loadLineChart(startdate, enddate, this.selectedOptions)
    .then(([invokeline, queryline, diffinvokeline, diffqueryline]) => {
      for (let i = 0; i < invokeline.dataset.length; i++) {
        this.tests[invokeline.dataset[i].seriesname.split(" ")[0]].i.values = []
        this.tests[queryline.dataset[i].seriesname.split(" ")[0]].q.values = []

        for (let datapoint of invokeline.dataset[i].data) {
          this.tests[invokeline.dataset[i].seriesname.split(" ")[0]].i.values.push(datapoint.value)
          datapoint.value = parseFloat(datapoint.value).toFixed(2)
        }
        for (let datapoint of queryline.dataset[i].data) {
          this.tests[queryline.dataset[i].seriesname.split(" ")[0]].q.values.push(datapoint.value)
          datapoint.value = parseFloat(datapoint.value).toFixed(2)
        }
        for (let datapoint of diffinvokeline.dataset[i].data) {
          datapoint.value = parseFloat(datapoint.value).toFixed(2)
        }
        for (let datapoint of diffqueryline.dataset[i].data) {
          datapoint.value = parseFloat(datapoint.value).toFixed(2)
        }
      }
      this.dataSource_invoke_line = invokeline
      this.dataSource_query_line = queryline
      this.dataSource_differentialinvoke_line = diffinvokeline
      this.dataSource_differentialquery_line = diffqueryline
      this.loadStats();
      this.diameter = 0
    })
    .catch(err => {
      this.diameter = 0
      throw err
    })
  }

  loadStats() {
    // Calculates and stores statistics

    for (let fabnum of this.selectedOptions) {
      let i_max = parseFloat(this.tests[fabnum].i.values.reduce(function(a,b) {return Math.max(a,b)})),
          i_min = parseFloat(this.tests[fabnum].i.values.reduce(function(a,b) {return Math.min(a,b)})),
          i_mean = (parseFloat(this.tests[fabnum].i.values.reduce(function(a,b) {return parseFloat(a)+parseFloat(b)})) / this.tests[fabnum].i.values.length)
      this.tests[fabnum].i.max = i_max.toFixed(2)
      this.tests[fabnum].i.min = i_min.toFixed(2)
      this.tests[fabnum].i.mean = i_mean.toFixed(2)
      this.tests[fabnum].i.prange = (((i_min - i_mean)/i_mean) * 100).toFixed(2) + "% ~ +" + (((i_max - i_mean)/i_mean) * 100).toFixed(2) + "%"

      let q_max = parseFloat(this.tests[fabnum].q.values.reduce(function(a,b) {return Math.max(a,b)})),
          q_min = parseFloat(this.tests[fabnum].q.values.reduce(function(a,b) {return Math.min(a,b)})),
          q_mean = (parseFloat(this.tests[fabnum].q.values.reduce(function(a,b) {return parseFloat(a)+parseFloat(b)})) / this.tests[fabnum].q.values.length)

      this.tests[fabnum].q.max = q_max.toFixed(2)
      this.tests[fabnum].q.min = q_min.toFixed(2)
      this.tests[fabnum].q.mean = q_mean.toFixed(2)
      this.tests[fabnum].q.prange = (((q_min - q_mean)/q_mean) * 100).toFixed(2) + "% ~ +" + (((q_max - q_mean)/q_mean) * 100).toFixed(2) + "%"
    }
  }

  loadAll(startdate, enddate) {
    this.diameter = 50
    this.loadTests()
    this.updateDate()
    this.loadCharts(startdate, enddate)
    this.diameter = 0
  }

  ngOnInit() {
    //// Init chosen tests to load
    this.selectedOptions = testlists.pte.selected
    //// Init chart's date range values
    let weekRange = this.dateselectService.weekRange()
    this.startdateinput.nativeElement.value = weekRange[0]
    this.enddateinput.nativeElement.value = weekRange[1]

    //// Init single day data's date value
    let today = this.dateselectService.getToday()
    this.dateinput.nativeElement.value = today
    this.chosendate = this.dateselectService.convertDateFormat(today)

    //// Load charts and data
  	this.loadAll(weekRange[0], weekRange[1])
  }
}