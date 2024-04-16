/*
SCRIPT FOR DETECTION HELPER FUNCTIONS
- ballDetected(SharpSensors *sharpsensor) - detects the presence of a ball
- oppDetected(SharpSensors *sharpsensor) - detects the presence of an opponent
- avoidOpponent() - takes action to avoid the opponent

*/

#ifndef DETECTION_H
#define DETECTION_H

/* FUNCTIONS DECLARATION */
void ballDetected(SharpSensors *sharpsensor);
task ball_detection();

void ballDetected(SharpSensors *sharpsensor){ 
	if ((sharpsensor->leftBallSensor >= 1200) && (sharpsensor->rightBallSensor >= 1200) && CURR_ORIENTATION == 180) {
		BALL_DETECTED = false;
		return;
	}
    if ((sharpsensor->leftBallSensor >= BALL_DIST_THRESHOLD || sharpsensor->rightBallSensor >= BALL_DIST_THRESHOLD) && sharpsensor->frontOppSensor < (BALL_DIST_THRESHOLD + 150))
    {
		BALL_DETECTED = true;
    }

	if ((sharpsensor->leftBallSensor < BALL_DIST_THRESHOLD && sharpsensor->rightBallSensor < BALL_DIST_THRESHOLD) || CURRENT_STATE == AVOID_LINE)
	{
		BALL_DETECTED = false;
	}


	if (CURRENT_STATE == AVOID_LINE || CURRENT_STATE == AVOID_OPPONENT_FRONT || CURRENT_STATE == AVOID_OPPONENT_BACK){
		BALL_DETECTED = false;
	}
}

task ball_detection() {
	while (1) {
		ballDetected(&sharpsensor);

		if (CURRENT_STATE != AVOID_LINE && CURRENT_STATE!=AVOID_OPPONENT_FRONT && CURRENT_STATE!=AVOID_OPPONENT_BACK && CURRENT_STATE != AVOID_BASE){
			if (BALL_DETECTED){
				CURRENT_STATE = COLLECT_BALL;
			}
		}
	}
} 

#endif