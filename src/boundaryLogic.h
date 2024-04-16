#ifndef BOUNDARY_H
#define BOUNDARY_H

/* FUNCTION DECLARATION */
void avoid_line();
task check_line();

void avoid_line(){

	driveWithTime("reverse", 1, 200);

	writeDebugStreamLine("LINE SENSOR INTERRUPT");

	// FOR RETURNING HOME AND LINE SENSOR TRIGGERED //
	if ((PREVIOUS_STATE == RETURN_HOME) && (line_sensor_rear_left_triggered() || line_sensor_rear_right_triggered())) {
		driveWithTime("reverse", 1, 500);

		writeDebugStreamLine("Checkline at Reverse home\n");
		if (limit_switches.limit_backL_depressed && limit_switches.limit_backR_depressed) {
			suspendTask(check_line);
			writeDebugStreamLine("DISABLING CHECKLINE\n");
			CURRENT_STATE = RELEASE_BALL;
			return;
		
		writeDebugStreamLine("NOT AT HOME\n");
		driveWithTime("forward", 1, 200);
		CURRENT_STATE = RETURN_HOME;
		return;
		}
	}
	
	// TESTED FRONT LEFT AND FRONT RIGHT //
	if (line_sensor_front_left_triggered()){
		LINE_SENSOR_SIDE = 'l';
		writeDebugStreamLine("LINE 1 SENSOR TRIGGERED\n");
		suspendTask(ball_detection);
		driveWithTime("reverse", 1, 750);
		resumeTask(ball_detection);
	}

	else if (line_sensor_front_right_triggered()) {
		LINE_SENSOR_SIDE = 'r';
		writeDebugStreamLine("LINE 2 SENSOR TRIGGERED\n");
		suspendTask(ball_detection);
		driveWithTime("reverse", 1, 750);
		resumeTask(ball_detection);
	}

	// NOT TESTED YET //
	else if (line_sensor_rear_left_triggered()) {
		LINE_SENSOR_SIDE = 'l';
		writeDebugStreamLine("LINE 3 SENSOR TRIGGERED\n");
		suspendTask(ball_detection);
		driveWithTime("forward", 1, 500);
		resumeTask(ball_detection);
	}

	else if (line_sensor_rear_right_triggered()) {
		LINE_SENSOR_SIDE = 'r';
		writeDebugStreamLine("LINE 4 SENSOR TRIGGERED\n");
		suspendTask(ball_detection);
		driveWithTime("forward", 1, 500);
		resumeTask(ball_detection);
	}
	CURRENT_STATE = PANAROMIC_SCAN;
}

task check_line(){
	while(1){
		if(line_sensor_front_left_triggered() || line_sensor_front_right_triggered()|| line_sensor_rear_left_triggered()||line_sensor_rear_right_triggered()){
			ENHANCED_PANAROMIC = true;
			if(CURRENT_STATE!=AVOID_LINE && CURRENT_STATE!=AVOID_OPPONENT_BACK && CURRENT_STATE!=AVOID_OPPONENT_FRONT){
				PREVIOUS_STATE = CURRENT_STATE;
		}
			CURRENT_STATE = AVOID_LINE;
		}
	}
}

#endif