/*
SCRIPT TO DECLARE & INITIALISE GLOBAL VARIABLES 
*/

// globals.
#ifndef GLOBALS_H
#define GLOBALS_H

// MACROS //
#define INITIAL_FORWARD_SEARCH 0
#define FORWARD_SEARCH 1
#define PANAROMIC_SCAN 2
#define COLLECT_BALL 3
#define RETURN_HOME 4
#define RELEASE_BALL 5
#define AVOID_LINE 6
#define AVOID_OPPONENT_FRONT 7
#define AVOID_OPPONENT_BACK 8
#define AVOID_BASE 9
#define TESTEND 10

// GLOBAL VARIABLES //
int CURR_ORIENTATION;
int CURRENT_STATE;
int PREVIOUS_STATE;
bool ENHANCED_PANAROMIC = false;
bool BALL_DETECTED = false;	
bool OPP_DETECTED = false;
const int BALL_DIST_THRESHOLD = 500; // change to 500 for actual run
const int OPP_FRONT_THRESHOLD = 1000; // 1200, 1300
const int OPP_BACK_THRESHOLD = 900; // 1200, 1300
const int SPIN_TIME = (int)(2750 *4/3);
const int COLLECT_BALL_TIME = 2000;
char LINE_SENSOR_SIDE = 'l'; // change accordingly once tested

int HOME_ORIENTATION = 0;

// structs //
typedef struct
{
	bool limit_main_ON;
	unsigned int buffer_count;
	bool limit_collector_depressed;
	bool limit_backL_depressed;
	bool limit_backR_depressed;
	bool limit_frontL_depressed;
	bool limit_frontR_depressed;

} LimitSwitches;

typedef struct
{
	float leftBallSensor;
	float rightBallSensor;
	float frontOppSensor;
	float backOppSensor;
} SharpSensors;

typedef struct 
{
	int last_known_ball_orientation;
	int x_coordinate;
	int y_coordinate;
	char zone; 
} Cache;

SharpSensors sharpsensor;
LimitSwitches limit_switches;
Cache cache;

#include "sharpLimitSensors.h"
#include "motorControls.h"
#include "compass.h"
#include "detection.h"
#include "oppLogic.h"
#include "boundaryLogic.h"
#include "stateManager.h"
#include "debug.c"

//Function to initialize value
void init(){
	PREVIOUS_STATE = INITIAL_FORWARD_SEARCH;
	CURRENT_STATE = INITIAL_FORWARD_SEARCH;

	sharpsensor.leftBallSensor = 100; // 1
	sharpsensor.rightBallSensor = 100; // 2
	sharpsensor.frontOppSensor = 100; // 3
	sharpsensor.backOppSensor = 100; // 4
	limit_switches.limit_main_ON = false;
	limit_switches.limit_collector_depressed = false;
	limit_switches.limit_backL_depressed = false;
	limit_switches.limit_backR_depressed = false;
	limit_switches.limit_frontL_depressed = false;
	limit_switches.limit_frontR_depressed = false;

	cache.last_known_ball_orientation = 0;
	cache.x_coordinate = 0;
	cache.y_coordinate = 0;
	cache.zone = 'A';
}

#endif

