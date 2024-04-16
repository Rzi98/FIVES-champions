#ifndef __STATEMANAGER__
#define __STATEMANAGER__

/* FUNCTIONS DECLARATION */
void forwardSearch(int duration);
void panaromicScan(char *rotation_direction, int speed_control);
void collectBall();
void returnHome(LimitSwitches *ls, SharpSensors *sharpsensor);
void releaseBall();
task updateSensors();
task stateControl();

/* FUNCTIONS IMPLEMENTATION */
void forwardSearch(int duration){
	int start = nSysTime;
	int speed = 1;
	if (PREVIOUS_STATE == INITIAL_FORWARD_SEARCH){
		duration = (int)(duration * 1.4);
		speed = 3;
		writeDebugStreamLine("INITIAL FAST SEARCH\n");
	}
	writeDebugStreamLine("duration: %d\n", duration);
	while (CURRENT_STATE == FORWARD_SEARCH && nSysTime - start < duration){
		if (BALL_DETECTED) {
			CURRENT_STATE = COLLECT_BALL;
			break;
		}
		writeDebugStreamLine("Speed: %d\n", speed);
		drive("forward", speed); // 1 for half speed
	}
	
	if (CURRENT_STATE != AVOID_OPPONENT_FRONT && CURRENT_STATE != AVOID_LINE && CURRENT_STATE !=AVOID_BASE){ 
		CURRENT_STATE = PANAROMIC_SCAN;
	}
}

void panaromicScan(char *rotation_direction, int speed_control){
	suspendTask(opponent_detection);

	int start_time = nSysTime;
	int local_spin_time;
	float multiplier = 1;

	if (ENHANCED_PANAROMIC){
		writeDebugStreamLine("ENHANCED PANAROMIC\n");
		multiplier = 0.75;
		if (LINE_SENSOR_SIDE == 'l')
			{
				rotation_direction = "cw";
				writeDebugStreamLine("CW\n");
			}
		else {writeDebugStreamLine("ACW\n");}
	}
	ENHANCED_PANAROMIC = false;

	local_spin_time = (int)(SPIN_TIME * multiplier);

	writeDebugStreamLine("PAN SEARCHING\n");

	while(CURRENT_STATE == PANAROMIC_SCAN && nSysTime - start_time <= local_spin_time)
	{
		if(BALL_DETECTED) {
			writeDebugStreamLine("BALL DETECTED\n");
			CURRENT_STATE = COLLECT_BALL;
			break;
		}
		rotate(rotation_direction, speed_control);
	}

	if (nSysTime - start_time >= local_spin_time){ // after spinning one round based on time
		writeDebugStreamLine("NO BALL DETECTED\n");
		CURRENT_STATE = FORWARD_SEARCH;
		writeDebugStreamLine("FORWARD SEARCH\n");
	}

	resumeTask(opponent_detection);
}

void collectBall(){
	int start_time = nSysTime;
	               
	spinRoller();

	while (!limit_switches.limit_collector_depressed && ((int)(nSysTime - start_time) <= COLLECT_BALL_TIME) && CURRENT_STATE == COLLECT_BALL){ // sensor still detect ball in front
		drive("forward", 1);
	}

	stop_drive_motors();

	if (limit_switches.limit_collector_depressed){ // BALL COLLECTED SUCCESSFUL //
		CURRENT_STATE = RETURN_HOME;
	}
	else{ // BALL COLLECTED FAILED //
		if (CURRENT_STATE != AVOID_OPPONENT_FRONT && CURRENT_STATE != AVOID_LINE && CURRENT_STATE != AVOID_BASE){
			CURRENT_STATE = PANAROMIC_SCAN;
		}
	}
	return;
}

void returnHome(LimitSwitches *ls, SharpSensors *sharpsensor) {
	suspendTask(ball_detection);

	if (CURR_ORIENTATION != HOME_ORIENTATION){
		rotateWithAngle(1, HOME_ORIENTATION);
		}

	while (!(ls->limit_backL_depressed && ls->limit_backR_depressed) && (CURRENT_STATE == RETURN_HOME)) {

		if (CURR_ORIENTATION == HOME_ORIENTATION){
			drive("reverse", 1);
			}
		else {
			rotateWithAngle(1,HOME_ORIENTATION);
		}
	}

	// RELEASE BALL //
	if (ls->limit_backL_depressed && ls->limit_backR_depressed)
	{
		stop_all_motors();
		CURRENT_STATE = RELEASE_BALL;
	}
}

void releaseBall(){
	driveWithTime("reverse", 1, 500);
	gate_action('o');
	while (limit_switches.limit_collector_depressed){
		if (!limit_switches.limit_collector_depressed) break;
		writeDebugStreamLine("WAITING FOR BALL TO ROLL\n");
	}
	delay(1000);
	gate_action('c');
	delay(1000);
	driveWithTime("forward", 1, 500);
	resumeTask(check_line);
	resumeTask(ball_detection);	
	CURRENT_STATE = INITIAL_FORWARD_SEARCH;
}

///////////////////// TASK //////////////////////////////////

task updateSensors(){
	while(1){
		sharpsensor.leftBallSensor = SensorValue[leftBallSensor];
		sharpsensor.rightBallSensor = SensorValue[rightBallSensor];
		sharpsensor.frontOppSensor = SensorValue[frontOppSensor];
		sharpsensor.backOppSensor = SensorValue[backOppSensor];
		checkLimitSwitches(&limit_switches, 'c');
		checkLimitSwitches(&limit_switches, 'b');

		if (limit_switches.limit_collector_depressed && CURRENT_STATE != AVOID_OPPONENT_BACK){ 
			CURRENT_STATE = RETURN_HOME;
		}
	}
}

task stateControl() {
	while (1) {
		writeDebugStreamLine("Current state: %d\n", CURRENT_STATE);

		switch (CURRENT_STATE) {

			case INITIAL_FORWARD_SEARCH:
			PREVIOUS_STATE = INITIAL_FORWARD_SEARCH;
			CURRENT_STATE = FORWARD_SEARCH;
			break;

			case FORWARD_SEARCH:
				forwardSearch(2000);
				break;

			case PANAROMIC_SCAN:
				panaromicScan("acw", 0);
				break;

			case COLLECT_BALL:
				collectBall();
				break;

			case RETURN_HOME:
				returnHome(&limit_switches, &sharpsensor);
				break;

			case RELEASE_BALL:
				releaseBall(); 
				break;

			case AVOID_OPPONENT_FRONT:
				avoidOppFront();
				break;
			
			case AVOID_OPPONENT_BACK:
				avoidOppBack();
				break;

			case AVOID_LINE:
				avoid_line();
				break;
			
			case AVOID_BASE:
				avoid_base();
				break;

			case TESTEND:
				stopAllTasks();
				break;

			default:
				writeDebugStreamLine("Not Implemented Error\n");
				break;
		}
	}
}

#endif
