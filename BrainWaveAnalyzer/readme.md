focus | attention | confusion | effort

Problem Statement:
Can a reliable model be built that measures an individual's brain waves and pupil dilation in order to explore effort, attention, focus, and struggle. By averaging this model’s predictions, can a metric of learning provide a reliable correlation to real life performance.

Overview:
The electroencephalogram (EEG) is widely viewed as the least intrusive window into the human mind. By taking the measurements of brain activity (microvolts), neuroscientists have been able to pinpoint specific physiological reactions to stimuli. Event related potentials (ERP)'s are the most studied as they produce easy to interpret peaks and troughs a reliable amount of time after a stimulus. However, there is far less published research on the process of learning within the mind. While experts have long pinpointed Beta waves as an rough indicator of focus and attention, more recent research has identified higher frequency gamma waves as an indicator of consciousness. However, the unavoidable challenge with interpreting gamma waves is that they oscillate in the brain at the some frequencies as muscle movement. With this basic understanding under my belt I have attempted to take some steps towards personally understanding the challenges, and contribute to the cause of understanding the process of learning.

Methodology:
Given the overwhelming challenge that was in front of me, it was important to start with designing an well thought out methodology to tackle this challenge. Though I was planning ambitious experiment, I still needed to limit some of the variables. The easy choice for feasibility was to limit the data collection to one participant -- myself.

EEG Collection:
I collected brainwave information by using the Muse EEG headband, the Muse Monitor iphone app to stream the data directly into a .csv and then processed the data with a handful of data cleaning Python scripts. Much care was given to collecting markers to signify different activities during the data collection process, and therefore, it was essential to then convert all data collected into the same common time format, Pandas DateTime.

For this initial "Simple" Model, I am attempting to classify piano performances as either "learned" or "learning". For the "learned" training data, I played a series of piano pieces that I know fairly well while collecting my EEG data. For the "learning" training data I sight read (and struggled through) never before seen music. After recording, the data was then processed using Fast Fourier Transformation (FFT) to pull out individual frequency ranges and amplitudes.

Pupil Dilation:
I collected pupil measurements using a headset from Pupil Labs. After painstaking setup of having to manipulate the headset to fit on top of the EEG headband, and still angled to observe my pupil measurements I ultimately was able to collect usable data, along with the corresponding time stamps to the align with the EEG data, after processing it into Pandas DateTime. However, much of the data was lost to head movement, so ultimately this process still needs to be refined if pupil data is to contribute to a final model. Given the questionable measurements, I found it best to use percent change in pupil dilation instead of absolute pupil size.

Audio Recording:
Lastly, I collected audio data in order to correspond with the collected EEG data. While not directly involved with this initial study, after some initial hurdles to building a Python audio recorder that also collects corresponding start and stop time stamps, it is not much harder to collect the audio in addition to the first data types. Ultimately, it will be fun to align brain waves with arrays of audio vectors and build some interesting applications from them.

Combining Data:
Even though the simple model only uses the EEG data, a scalable pipeline was built in Python to read .csv files from various directories, combine the data types, filter out unusable information, and preprocess it for modeling with a Standard Scaler. Audio arrays were resized to correspond with a given row of audio data.

Modeling:
The data is was then run through a series of Linear and Tree based models in Scikit Learn.

Conclusion:¶
I believe I have successfully been able to isolate performances of "Learned" music from those that are not yet learned. The visualizations above clearly illustrate separation of gamma frequencies on the AF7 channel of the Muse headband. However, there are limits to this study. First, the predictions over an entire piece become more accurate with more data. The final test (consecutive performances), were short 1 minute clips. In the line graph above, it took almost 4 minutes of "Learned" playing before gamma waves diverged from that of corresponding "Learning" data set.

In addition, while the is over 1.5 million rows of data, much of it is correlated to itself. There are only a dozen or so unique performances included in the training/validation and test sets. As more data is included in training/validation it will be interesting to see how the performance of the model begins to change.
