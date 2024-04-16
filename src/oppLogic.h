#ifndef OPPONENT_H
#define OPPONENT_H

/* FUNCTION DECLARATION */
void oppDetected(SharpSensors *sharpsensor, char opp_direction);
void avoidOppFront();
void avoidOppBack();
task opponent_detection();

void oppDetected(SharpSensors *sharpsensor, char opp_direction)
{
	if (CURRENT_STATE != AVOID_OPPONENT_FRONT && CURRENT_STATE != AVOID_OPPONENT_BACK && CURRENT_STATE != AVOID_LINE) {
		PREVIOUS_STATE = CURRENT_STATE;
	}

	switch (opp_direction) {
		case 'F':
			if ((sharpsensor->rightBallSensor >= 1200 && sharpsensor->leftBallSensor >= 1200) && CURR_ORIENTATION == 180) {
				CURRENT_STATE = AVOID_BASE;
				return;
			}

			if (sharpsensor->frontOppSensor >= OPP_FRONT_THRESHOLD) 
			{
				CURRENT_STATE = AVOID_OPPONENT_FRONT;
			}
		case 'B':
			if (sharpsensor->backOppSensor >= OPP_BACK_THRESHOLD && (limit_switches.limit_collector_depressed || CURRENT_STATE == RETURN_HOME)){
				CURRENT_STATE = AVOID_OPPONENT_BACK;
			}
			break;
	return;
	}
}

void avoidOppFront() {
	while (CURRENT_STATE == AVOID_OPPONENT_FRONT){
		writeDebugStreamLine("Opponent infront ACTION\n");
		spinRoller();
		driveWithTimeOpp("reverse", 1, 1000); // TO TEST
		rotateWithTimeOpp("acw", 2, 400);
		if (CURRENT_STATE != AVOID_LINE){
			CURRENT_STATE = FORWARD_SEARCH;
			return;
		}
	}
	return;
}

void avoidOppBack() {
	while (CURRENT_STATE == AVOID_OPPONENT_BACK){
		writeDebugStreamLine("Opponent behind ACTION\n");
		stopRoller();
		driveWithTimeOpp("forward", 1, 1000);
		rotateWithTimeOpp("acw", 2, 450);
		driveWithTimeOpp("forward", 1, 1000);
		if (CURRENT_STATE != AVOID_LINE) {
			CURRENT_STATE = RETURN_HOME;
			spinRoller();
			return;
		}
	}
	return;
}

void avoid_base() {
	while (CURRENT_STATE == AVOID_BASE){
		writeDebugStreamLine("LIMIT FRONT TRIGGERED\n");
		suspendTask(ball_detection);
		driveWithTime("reverse", 1, 1200);
		rotateWithAngle(1, 0);
		resumeTask(ball_detection);
		CURRENT_STATE = FORWARD_SEARCH;
	}
}

task opponent_detection(){
	while(1){
		checkLimitSwitches(&limit_switches, 'r');

		if (limit_switches.limit_frontR_depressed && CURRENT_STATE != AVOID_LINE && CURR_ORIENTATION == 180){
			CURRENT_STATE = AVOID_BASE;
			
		}
		else if (CURRENT_STATE != AVOID_LINE){

			if(!limit_switches.limit_collector_depressed || CURRENT_STATE != RETURN_HOME) 
				{
				oppDetected(&sharpsensor, 'F');
				}
			else {
				oppDetected(&sharpsensor, 'B');
				}
		}
	}
}


#endif