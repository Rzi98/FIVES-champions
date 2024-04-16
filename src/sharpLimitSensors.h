#ifndef __SENSOR__
#define __SENSOR__

/* LIMIT SWITCHES */
void checkLimitSwitches(LimitSwitches *ls, char switch_type){
	switch(switch_type){

		/* MAIN Limit Switch */
		case 'm':
			if (SensorValue[mainLimit] == 0){
				if (ls->limit_main_ON == false){
					ls->limit_main_ON = true;
				}
				else {
					ls->limit_main_ON = false;
				}
			}

			break;

		/* COLLECTOR Limit Switch */
		case 'c':
			if (SensorValue[collectorLimit] == 0){
				ls->limit_collector_depressed = true;
			}
			else{
				ls->limit_collector_depressed = false;
			}
			break;
		
		case 'l':
			if (SensorValue[leftFrontLimit] < 1){
				ls->limit_frontL_depressed = true;
			}
			else{
				ls->limit_frontL_depressed = false;
			}
			break;
		
		case 'r':
			if (SensorValue[rightFrontLimit] < 1){
				ls->limit_frontR_depressed = true;
			}
			else{
				ls->limit_frontR_depressed = false;
			}
			break;

		/* BACK Limit Switches */
		case 'b': 
			if (SensorValue[backLeftLimit] == 0){
				ls->limit_backL_depressed = true;
			}
			else{
				ls->limit_backL_depressed = false;
			}
			if (SensorValue[backRightLimit] == 0){
				ls->limit_backR_depressed = true;
			}
			else{
				ls->limit_backR_depressed = false;
			}
			break;
	}
}

/* LINE SENSORS */
bool line_sensor_front_right_triggered(){
	if(SensorValue(rightFrontLine)< 1)
		return true;
	else 
		return false;
}

bool line_sensor_front_left_triggered(){
	if(SensorValue(leftFrontLine)< 1)return true;
	else return false;
}

bool line_sensor_rear_left_triggered(){
	if(SensorValue(leftBackLine)< 1)return true;
	else return false;
}

bool line_sensor_rear_right_triggered(){
	if(SensorValue(rightBackLine)< 1)return true;
	else return false;
}

#endif
