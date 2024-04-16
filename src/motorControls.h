/*
SCRIPT FOR MOTOR CONTROL
- drive(char* drive_mode, int speed_control) - drives the robot forward or backward
- driveWithTime(char* drive_mode, int speed_control, int duration) - drives the robot forward or backward for a certain duration
- rotate(char* drive_mode, int speed_control) - rotates the robot clockwise or anticlockwise
- rotateWithTime(char* drive_mode, int speed_control, int duration) - rotates the robot clockwise or anticlockwise for a certain duration
- rotateWithAngle(int speed_control, int target_angle) - rotates the robot to a certain angle
- stop_all_motors() - stops all motors
- spinRoller() - spins the roller motor
- gate_action(char action) - opens or closes the gate

// TIPS: 
- With Time: Non interruptable

Created by: Raizee, 2024
*/

#ifndef MOTOR_CONTROL
#define MOTOR_CONTROL

#define MAX_SPEED 127
#define HALF_SPEED 55
#define FAST_SPEED 127
#define PANNING_SPEED 45
#define ROLLER_SPEED 127 //100
#define GATE_MOTOR_SPEED 50

#define TURN_SPEED_LOWER 20
#define TURN_SPEED_HIGHER 50

/* FUNCTION DECLARATION */
void drive(char *drive_mode, int speed_control);
void driveWithTime(char *drive_mode, int speed_control, int duration);
void driveWithTimeOpp(char *drive_mode, int speed_control, int duration);
void rotate(char *drive_mode, int speed_control);
void rotateWithTime(char *drive_mode, int speed_control, int duration);
void rotateWithTimeOpp(char *drive_mode, int speed_control, int duration);
void rotateWithTimeBall(char *drive_mode, int speed_control, int duration);
void rotateWithAngle(int speed_control, int target_angle);
void turn(char *direction, int speed_type, char *turning_radius);
void steerWTime(char *direction, int speed_type, char *turning_radius, int duration);
void gate_action(char action);
void spinRoller();
void stopRoller();
void stop_all_motors();

/* FUNCTION IMPLEMENTATION */
void drive(char *drive_mode, int speed_control)
{
	if (strncmp(drive_mode, "forward", strlen(drive_mode)) == 0)
	{
		if (speed_control == 1)
		{
			motor[left_motor] = -(HALF_SPEED);
			motor[right_motor] = HALF_SPEED;
		}
		else if (speed_control == 2)
		{
			motor[left_motor] = -MAX_SPEED;
			motor[right_motor] = MAX_SPEED;
		}
		else if (speed_control == 3)
		{
			motor[left_motor] = -FAST_SPEED;
			motor[right_motor] = FAST_SPEED;
		}
	}

	else if (strncmp(drive_mode, "reverse", strlen(drive_mode)) == 0)
	{
		if (speed_control == 1)
		{
			motor[left_motor] = HALF_SPEED;
			motor[right_motor] = -HALF_SPEED;
		}
		else if (speed_control == 2)
		{
			motor[left_motor] = MAX_SPEED;
			motor[right_motor] = -MAX_SPEED;
		}
		else if (speed_control == 3)
		{
			motor[left_motor] = FAST_SPEED;
			motor[right_motor] = -FAST_SPEED;
		}
	}
}

void driveWithTime(char *drive_mode, int speed_control, int duration)
{
	int start = nSysTime;
	while((nSysTime - start < duration)) {
		if (strncmp(drive_mode, "forward", strlen(drive_mode)) == 0)
		{
			if (speed_control == 1)
			{
				motor[left_motor] = -(HALF_SPEED);
				motor[right_motor] = HALF_SPEED;
			}
			else if (speed_control == 2)
			{
				motor[left_motor] = -MAX_SPEED;
				motor[right_motor] = MAX_SPEED;
			}
		}

		else if (strncmp(drive_mode, "reverse", strlen(drive_mode)) == 0)
		{
			if (speed_control == 1)
			{
				motor[left_motor] = HALF_SPEED;
				motor[right_motor] = -HALF_SPEED;
			}
			else if (speed_control == 2)
			{
				motor[left_motor] = MAX_SPEED;
				motor[right_motor] = -MAX_SPEED;
			}
		}
	}
}

void driveWithTimeOpp(char *drive_mode, int speed_control, int duration)
{
	int start = nSysTime;
	while((nSysTime - start < duration) && (CURRENT_STATE == AVOID_OPPONENT_FRONT || CURRENT_STATE == AVOID_OPPONENT_BACK)) {
		if (strncmp(drive_mode, "forward", strlen(drive_mode)) == 0)
		{
			if (speed_control == 1)
			{
				motor[left_motor] = -(HALF_SPEED);
				motor[right_motor] = HALF_SPEED;
			}
			else if (speed_control == 2)
			{
				motor[left_motor] = -MAX_SPEED;
				motor[right_motor] = MAX_SPEED;
			}
		}

		else if (strncmp(drive_mode, "reverse", strlen(drive_mode)) == 0)
		{
			if (speed_control == 1)
			{
				motor[left_motor] = HALF_SPEED;
				motor[right_motor] = -HALF_SPEED;
			}
			else if (speed_control == 2)
			{
				motor[left_motor] = MAX_SPEED;
				motor[right_motor] = -MAX_SPEED;
			}
		}
	}
}

void rotate(char *drive_mode, int speed_control)
{
	if (strncmp(drive_mode, "acw", strlen(drive_mode)) == 0)
	{
		if (speed_control == 1)
		{
			motor[left_motor] = HALF_SPEED;
			motor[right_motor] = HALF_SPEED;
		}

		else if (speed_control == 2)
		{
			motor[left_motor] = MAX_SPEED;
			motor[right_motor] = MAX_SPEED;
		}

		else if (speed_control == 0)
		{
			motor[left_motor] = PANNING_SPEED;
			motor[right_motor] = PANNING_SPEED;
		}
	}

	else if (strncmp(drive_mode, "cw", strlen(drive_mode)) == 0)
	{
		if (speed_control == 1)
		{
			motor[left_motor] = -HALF_SPEED;
			motor[right_motor] = -HALF_SPEED;
		}

		else if (speed_control == 2)
		{
			motor[left_motor] = -MAX_SPEED;
			motor[right_motor] = -MAX_SPEED;
		}

		else if (speed_control == 0)
		{
			motor[left_motor] = -PANNING_SPEED;
			motor[right_motor] = -PANNING_SPEED;
		}
	}
}

void rotateWithTime(char *drive_mode, int speed_control, int duration)
{
	int start = nSysTime;

	while ((nSysTime - start < duration))
	{
		if (strncmp(drive_mode, "acw", strlen(drive_mode)) == 0)
		{
			if (speed_control == 1)
			{
				motor[left_motor] = HALF_SPEED;
				motor[right_motor] = HALF_SPEED;
			}

			else if (speed_control == 2)
			{
				motor[left_motor] = MAX_SPEED;
				motor[right_motor] = MAX_SPEED;
			}

			else if (speed_control == 0)
			{
				motor[left_motor] = PANNING_SPEED;
				motor[right_motor] = PANNING_SPEED;
			}
		}

		else if (strncmp(drive_mode, "cw", strlen(drive_mode)) == 0)
		{
			if (speed_control == 1)
			{
				motor[left_motor] = -HALF_SPEED;
				motor[right_motor] = -HALF_SPEED;
			}

			else if (speed_control == 2)
			{
				motor[left_motor] = -MAX_SPEED;
				motor[right_motor] = -MAX_SPEED;
			}

			else if (speed_control == 0)
			{
				motor[left_motor] = -PANNING_SPEED;
				motor[right_motor] = -PANNING_SPEED;
			}
		}
	}
}

void rotateWithTimeOpp(char *drive_mode, int speed_control, int duration)
{
	int start = nSysTime;

	while ((nSysTime - start < duration) && (CURRENT_STATE == AVOID_OPPONENT_FRONT || CURRENT_STATE == AVOID_OPPONENT_BACK))
	{
		if (strncmp(drive_mode, "acw", strlen(drive_mode)) == 0)
		{
			if (speed_control == 1)
			{
				motor[left_motor] = HALF_SPEED;
				motor[right_motor] = HALF_SPEED;
			}

			else if (speed_control == 2)
			{
				motor[left_motor] = MAX_SPEED;
				motor[right_motor] = MAX_SPEED;
			}

			else if (speed_control == 0)
			{
				motor[left_motor] = PANNING_SPEED;
				motor[right_motor] = PANNING_SPEED;
			}
		}

		else if (strncmp(drive_mode, "cw", strlen(drive_mode)) == 0)
		{
			if (speed_control == 1)
			{
				motor[left_motor] = -HALF_SPEED;
				motor[right_motor] = -HALF_SPEED;
			}

			else if (speed_control == 2)
			{
				motor[left_motor] = -MAX_SPEED;
				motor[right_motor] = -MAX_SPEED;
			}

			else if (speed_control == 0)
			{
				motor[left_motor] = -PANNING_SPEED;
				motor[right_motor] = -PANNING_SPEED;
			}
		}
	}
}

void rotateWithTimeBall(char *drive_mode, int speed_control, int duration)
{
	int start = nSysTime;

	while ((nSysTime - start < duration) && (CURRENT_STATE== COLLECT_BALL))
	{
		if (strncmp(drive_mode, "acw", strlen(drive_mode)) == 0)
		{
			if (speed_control == 1)
			{
				motor[left_motor] = HALF_SPEED;
				motor[right_motor] = HALF_SPEED;
			}

			else if (speed_control == 2)
			{
				motor[left_motor] = MAX_SPEED;
				motor[right_motor] = MAX_SPEED;
			}

			else if (speed_control == 0)
			{
				motor[left_motor] = PANNING_SPEED;
				motor[right_motor] = PANNING_SPEED;
			}
		}

		else if (strncmp(drive_mode, "cw", strlen(drive_mode)) == 0)
		{
			if (speed_control == 1)
			{
				motor[left_motor] = -HALF_SPEED;
				motor[right_motor] = -HALF_SPEED;
			}

			else if (speed_control == 2)
			{
				motor[left_motor] = -MAX_SPEED;
				motor[right_motor] = -MAX_SPEED;
			}

			else if (speed_control == 0)
			{
				motor[left_motor] = -PANNING_SPEED;
				motor[right_motor] = -PANNING_SPEED;
			}
		}
	}
}

void rotateWithAngle(int speed_control, int target_angle)
{
	int clockwise_diff = (target_angle - CURR_ORIENTATION + 360) % 360;
	int anticlockwise_diff = (CURR_ORIENTATION - target_angle + 360) % 360;

	if (clockwise_diff > anticlockwise_diff)
	{
		while (CURR_ORIENTATION != target_angle)
		{
			rotate("cw", speed_control);
			// writeDebugStreamLine("CURRENT ANGLE: %d\n", CURR_ORIENTATION);
		}
		stop_all_motors();
		spinRoller();
	}
	else if (clockwise_diff <= anticlockwise_diff)
	{
		while (CURR_ORIENTATION != target_angle)
		{
			rotate("acw", speed_control);
			// writeDebugStreamLine("CURRENT ANGLE: %d\n", CURR_ORIENTATION);
		}
		stop_all_motors();
		spinRoller();
	}
}

void turn(char *direction, int speed_type, char *turning_radius)
{
	if (direction == "left")
	{
		if (speed_type == 1 && turning_radius == "smooth")
		{
			motor[left_motor] = -TURN_SPEED_LOWER;
			motor[right_motor] = TURN_SPEED_HIGHER;
		}

		if (speed_type == 1 && turning_radius == "wide")
		{
			motor[left_motor] = -25;
			motor[right_motor] = 50;
		}

		if (speed_type == 1 && turning_radius == "sharp")
		{
			motor[left_motor] = -15;
			motor[right_motor] = 50;
		}
	}
	else if (direction == "right")
	{
		if (speed_type == 1 && turning_radius == "smooth")
		{
			motor[left_motor] = -TURN_SPEED_HIGHER;
			motor[right_motor] = TURN_SPEED_LOWER;
		}

		if (speed_type == 1 && turning_radius == "wide")
		{
			motor[left_motor] = -50;
			motor[right_motor] = 25;
		}

		if (speed_type == 1 && turning_radius == "sharp")
		{
			motor[left_motor] = -50;
			motor[right_motor] = 15;
		}
	}
}

void steerWTime(char *direction, int speed_type, char *turning_radius, int duration)
{
	int start = nSysTime;
	while (nSysTime - start < duration)
	{
		if (direction == "left")
		{
			if (speed_type == 1 && turning_radius == "smooth")
			{
				motor[left_motor] = -TURN_SPEED_LOWER;
				motor[right_motor] = TURN_SPEED_HIGHER;
			}

			if (speed_type == 1 && turning_radius == "wide")
			{
				motor[left_motor] = -25;
				motor[right_motor] = 50;
			}

			if (speed_type == 1 && turning_radius == "sharp")
			{
				motor[left_motor] = -15;
				motor[right_motor] = 50;
			}
		}
		else if (direction == "right")
		{
			if (speed_type == 1 && turning_radius == "smooth")
			{
				motor[left_motor] = -TURN_SPEED_HIGHER;
				motor[right_motor] = TURN_SPEED_LOWER;
			}

			if (speed_type == 1 && turning_radius == "wide")
			{
				motor[left_motor] = -50;
				motor[right_motor] = 25;
			}

			if (speed_type == 1 && turning_radius == "sharp")
			{
				motor[left_motor] = -50;
				motor[right_motor] = 15;
			}
		}
	}
}

void gate_action(char action)
{
	if (action == 'o') // open
	{
		int start = nSysTime;
		while (nSysTime - start < 350) {
			motor[gate_motor] = GATE_MOTOR_SPEED;
		}
		motor[gate_motor] = 0;
	}
	else if (action == 'c') // close
	{
		int start = nSysTime;
		while (nSysTime - start < 350) {
			motor[gate_motor] = -GATE_MOTOR_SPEED;
		}
		motor[gate_motor] = 0;
	}
}

void spinRoller() {
	motor[roller_motor] = -ROLLER_SPEED;
}

void stopRoller() {
	motor[roller_motor] = 0;
}

void stop_all_motors()
{
	motor[left_motor] = 0;
	motor[right_motor] = 0;
	motor[roller_motor] = 0;
}

void stop_drive_motors() {
	motor[left_motor] = 0;
	motor[right_motor] = 0;
}

#endif
