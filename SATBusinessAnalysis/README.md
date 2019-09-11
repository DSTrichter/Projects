## Problem Statement
The SAT is both the best entrance exam for both colleges to measure student potential, and for students to prepare for the rigors of an undergraduate college education.  In order to best serve that vision, College Board must find ways to strategically use it's budget to expand beyond the current test taking base.

To accomplish this, we will strategically conduct an exploratory data analysis of participation and score results from recent SAT and it's primary competitor exam (the ACT), in order to find the lowest hanging fruit and best bang for the buck to increase participation, and positively impact SAT scores.

## Executive Summary

### Contents:
- [2017 Data Import & Cleaning](#Data-Import-and-Cleaning)
- [2018 Data Import and Cleaning](#2018-Data-Import-and-Cleaning)
- [Exploratory Data Analysis](#Exploratory-Data-Analysis)
- [Data Visualization](#Visualize-the-data)
- [Descriptive and Inferential Statistics](#Descriptive-and-Inferential-Statistics)
- [Outside Research](#Outside-Research)
- [Conclusions and Recommendations](#Conclusions-and-Recommendations)

## Data Dictionary

|Feature|Type|Dataset|Description|
|---|---|---|---|
|**state**|int/float/object|2017-18 ACT/SAT Exams|This is an example|
|**2017_sat_participation**|float64|2017-18 ACT/Sat Exams| The SAT participation rate in the state in 2017.
|**2017_sat_erw**|int64|2017-18 ACT/Sat Exams|The state's 2017 SAT Evidence-Based Reading & Writing mean section score.
|**2017_sat_math**|int64|2017-18 ACT/Sat Exams|The state's 2017 SAT Math mean section score.
|**2017_sat_total**|int64|2017-18 ACT/Sat Exams|The state's mean 2017 SAT Total Score.   
|**2017_act_participation**|float64|2017-18 ACT/Sat Exams|The ACT participation rate in the state in 2017.
|**2017_act_english**|float64|2017-18 ACT/Sat Exams|The state's 2017 ACT English mean section score.
|**2017_act_math**|float64|2017-18 ACT/Sat Exams|The state's 2017 ACT Math mean section score.
|**2017_act_reading**|float64|2017-18 ACT/Sat Exams|The state's 2017 ACT Reading mean section score.
|**2017_act_science**|float64|2017-18 ACT/Sat Exams|The state's 2017 ACT Science mean section score.
|**2017_act_composite**|float64|2017-18 ACT/Sat Exams|The state's mean 2017 ACT Composite score. The 4 section scores, averaged.
|**2018_sat_participation**|float64|2017-18 ACT/Sat Exams| The SAT participation rate in the state in 2018.
|**2018_sat_erw**|int64|2017-18 ACT/Sat Exams|The state's 2018 SAT Evidence-Based Reading & Writing mean section score.
|**2018_sat_math**|int64|2017-18 ACT/Sat Exams|The state's 2018 SAT Math mean section score.
|**2018_sat_total**|int64|2017-18 ACT/Sat Exams|The state's mean 2018 SAT Total Score.   
|**2018_act_participation**|float64|2017-18 ACT/Sat Exams|The ACT participation rate in the state in 2018.
|**2018_act_english**|float64|2017-18 ACT/Sat Exams|The state's 2018 ACT English mean section score.
|**2018_act_math**|float64|2017-18 ACT/Sat Exams|The state's 2018 ACT Math mean section score.
|**2018_act_reading**|float64|2017-18 ACT/Sat Exams|The state's 2018 ACT Reading mean section score.
|**2018_act_science**|float64|2017-18 ACT/Sat Exams|The state's 2018 ACT Science mean section score.
|**2018_act_composite**|float64|2017-18 ACT/Sat Exams|The state's mean 2018 ACT Composite score. The 4 section scores, averaged.

## Conclusions and Recommendations

After conducting my analysis, there are two recommendations I can make to improve the status of the SAT exam.

The strategy to increase participation in the SAT lies in catering to the goals of state education boards and legislatures in ACT stronghold states.  For example, while participation rates in both exams were largely the same between 2017 and 2018, two states jumped out as anomalies.  Colorado jumped from 11% participation to 100% participation, and Illinois jumped from 9% participation to 99% participation.  Upon further research, both states switched mandatory examination from the ACT to the SAT in 2018.  

If we want more participants of the SAT nationwide, we must convert ACT strongholds.  There are still 16 states with full (98% or higher) participation in the ACT, so the governments of those states should be our targets.  I would start with Wisconsin (neighbor of Illinois), Utah (neighbor of Colorado).  Working with neighboring (and somewhat similar) states will allow us to more easily share resources and strategies.  In addition, I would take a closer look at Florida, who overall had a huge drop in students taking either exam.  There is an oppourtunity there to renew faith in the SAT in one of the largest states in the country.

In tandem, we should be doing what we can to make it easier to prepare for the SAT.  Exam scores have dipped between 2017 and 2018, year over year, and while two years is a small sample size, it is something to continue monitoring.  Working with education boards in states that are still ACT strongholds (mostly in the south and the midwest), we should continue to develop customized strategies to make SAT test prep materials more accessible to students in their states, and then open those solutions up nationwide.  Although we have already begun to done so through the Kahn Academy online platform, there is clearly more to do to provide low income and rural populations quality test preparation materials.  
