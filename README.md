<h1 align='center'>MA4012 AY23/24 Semester 2 Champions 🏆</h1>

<br>

<div align='center' style="text-align:center">

![Sample Image](https://images.scholarschoice.com.sg/wp-content/uploads/2017/06/NTU.png)

</div>

<br>

# Project Description #

<p style = "font-size: 15px;">
    This project is part of the MA4012 course at NTU MAE. It involves designing and building a robot that can retrieve up to three tennis balls and return them to a designated drop-off point. Two robots compete against each other to collect the most balls in a three-minute showdown. In addition to ball collection, the robot must be capable of detecting opponents to avoid collisions and detecting edges to prevent going out of bounds.
</p>

# Strategy # 
<div style = "font-size: 15px;">
    Our team's winning strategy focuses on the following key areas:
    <ol style="line-height: 1.8;"> 
        <li style="margin-bottom: 5px;"> Efficient ball collection </li>
        <li style="margin-bottom: 5px;"> Speed </li>
        <li style="margin-bottom: 5px;"> Cover large ground of areas </li> 
        <li style="margin-bottom: 5px;"> Task Priority </li> 
    </ol>

</div>

<h3> 1. <u>Efficient Ball Collection</u> </h3>

- Rubber Band Roller is state of the art for ball collection. It is a simple and effective mechanism that can collect balls from a wide range of angles. Compared to other designs like the hook or lifting mechanisms, the rubber band roller will never misfire ensuring that this action is never the bottleneck of the entire flow. (Refer to our design hyperlink below for visualisation)

<h3> 2. <u>Speed</u> </h3>

- This is a crucial factor in the competition as it allows the robot to cover more ground and always win the first ball. We can't emphasise enough how important it is to win the first ball as the first initial search for the ball is the easiest to collect at least 1 ball. Hence, beating the opponent to the first ball is crucial. To achieve this, we have designed our drive train to be as fast as possible but maintaining some weight to prevent the robot from getting pushed around by a bigger opponent robot. (Refer to our drive train design)

<h3> 3. <u>Cover Large Ground of Areas</u> </h3>

- Speed helps us to cover more ground but it is not enough. We need good search algorithms to ensure that the robot do not circle in a loop or waste to much time pan searching. We designed an algorithm such that the robot will never search for the same area/direction twice (unless triggered by interrupts -opp detection, etc...). This ensures that the robot will cover as much ground as possible in the 3 minutes. (Refer to our code)

<h3> 4. <u>Task Priority</u> </h3>

- It is important to have a good task priority system to ensure that the robot is always doing the most important task at that moment. For example, if the robot is collecting a ball and the line sensor gets triggered, the robot should immediately stop collecting the ball and perform an avoid boundary action. This is crucial to ensure our robot will never go out of bounds or get stuck at the edges. (Refer toTask Priority below)

- Priority as follows:
    1. Boundary Avoidance
    2. Opponent Avoidance
    3. Ball Collection

<br>

<h1> File Description </h1>

| File                  | Description                                                  | Task Priority |
|-----------------------|--------------------------------------------------------------|---------------|
| `main.c`              | Run the main task function                                   | -             |
| `stateManager.h`      | Handles state change and calls action functions for that state | -           |
| `boundaryLogic.h`     | Line detection sensor conditions and actions                 | 1             |
| `oppLogic.h`          | Opponent detection sensor conditions and actions             | 2             |
| `detection.h`         | Ball detection sensor conditions and actions                 | 3             |
| `compass.h`           | Get compass orientation value                                | -             |
| `motorControls.h`     | Low-level motor-related code                                 | -             |
| `sharpLimitSensor.c`  | Check limit switch code and sharp sensor boolean             | -             |



## Logic Flowchart ##

<h3>Base Algorithm (The one we used in competition)</h3>

- ![image_2024-03-16_00-56-31]()

<h3>Memoisation (Optimisation, we didn't have time to try)</h3>

- Honestly this is too complicated for us to implement in the short time we had. It is also very difficult to pull off because there will be a lot of math and testing involved. I am not too sure if it will 100% work but it is does, your robot will always win the consecutive balls.

- ![image_2024-03-16_00-56-42]()

## Designs ##
Checkout our design by clicking the link: **[Design](./markdown/design.md)**

## Photos ##
Checkout our bot and team photos here **[Photos](./markdown/photo.md)**

## Tips ##

- This is a game of chance not luck, you can improve your winning chance tremedously by having good designs and algorithms. Efficient algorithms can make a huge different.

#### Pan Search Algorithm: ####

    Most of our opponents used the basic pan searching strategy, basically like how a fan rotates. From centre to left, then centre to right. This is a very inefficient way of searching as the robot will always search the same area twice. We designed an algorithm that does a 360 degree search and then continue with forward search. 

    If your robot is unable to locate the ball in the first scan, it is unlikely it is able to locate the ball in the second scan.

#### QA Testing: ####

    There are many edge cases in this competition. You need to test and debug your failure cases a lot. Don't simply test for the cases that work. Test for stuff such as when your robot gets cornered, etc...
