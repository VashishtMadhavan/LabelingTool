# Web-Based Segmentation Interface

We present a sleek, web-based  tool for fine-grained annotation of arbitrary images.. It is a very simple, general-purpose
framework for generating semantic segmentation labels. We hope this tool will speed up the 
development of semantic segmentation datasets, by lowering the cost of annotation and the 
amount of time needed to develop web deployed interfaces.
 
This application runs a Django backend and the requirements are outlined below.
Please look at the README in main for more details. This application requires <b> Django >= 1.11 </b>

## Overview
This tool is based on code from OpenSurfaces(see citation below) and LabelMe, two very popular tools
for fine-grained image annotation. LabelMe is the most common, yet it does not expose a web interface,
making it difficult to centralize data storage and distribute among workers. OpenSurfaces is much better
suited for fine-grained segmentation, yet the codebase is dense and difficult to navigate.

<img src='platform.png'></img>

Our tool focuses on simplicity and ease of setup. There is a clean, clear interface for segmenting and labeling objects and requires only two lines to setup! The README in main describes the setup
process in further detail. We also provide  a review interface for consistency and correctness of annotation. The deployment configuration of this application is left to the user.

## Citations

	Sean Bell, Paul Upchurch, Noah Snavely, Kavita Bala
	OpenSurfaces: A Richly Annotated Catalog of Surface Appearance
	ACM Transactions on Graphics (SIGGRAPH 2013)
	
	@article{bell13opensurfaces,
		author = "Sean Bell and Paul Upchurch and Noah Snavely and Kavita Bala",
		title = "Open{S}urfaces: A Richly Annotated Catalog of Surface Appearance",
		journal = "ACM Trans. on Graphics (SIGGRAPH)",
		volume = "32",
		number = "4",
		year = "2013",
	}



