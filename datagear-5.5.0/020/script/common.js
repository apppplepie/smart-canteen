var DAYS_OF_WEEK = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

var currentDateTimeTimer = null;

function currentDateTime(elementId)
{
	if(currentDateTimeTimer != null)
		clearTimeout(currentDateTimeTimer);
	
	var ele = document.getElementById(elementId);
	
	if(!ele)
		return;
	
	var dt = new Date();
	var y = dt.getFullYear();
	var mt = dt.getMonth() + 1;
	var day = dt.getDate();
	var h = dt.getHours();
	var m = dt.getMinutes();
	var s = dt.getSeconds();
	var dayOfWeek = dt.getDay();
	
	mt = (mt < 10 ? "0"+mt : mt);
	day = (day < 10 ? "0"+day : day);
	h = (h < 10 ? "0"+h : h);
	m = (m < 10 ? "0"+m : m);
	s = (s < 10 ? "0"+s : s);
	dayOfWeek = DAYS_OF_WEEK[dayOfWeek];
	
	ele.innerHTML = y + "-" + mt + "-" + day + " " + h + ":" + m + ":" + s + " " + dayOfWeek;
	currentDateTimeTimer = setTimeout(function(){ currentDateTime(elementId); }, 1000);    
}