
SPATIAL_TYPE_POINT = 1
SPATIAL_TYPE_LINESTRING = 2
SPATIAL_TYPE_POLYGON = 3
SPATIAL_TYPE_MULTIPOINT = 4
SPATIAL_TYPE_MULTILINESTRING = 5
SPATIAL_TYPE_MULTIPOLYGON = 6
SPATIAL_TYPE_GEOMETRY_COLLECTION = 7 # Not implemented

SPATIAL_TYPE_STRING = {
	SPATIAL_TYPE_POINT:'point', SPATIAL_TYPE_LINESTRING:'linestring', SPATIAL_TYPE_POLYGON:'polygon', 
	SPATIAL_TYPE_MULTIPOINT:'multipoint', SPATIAL_TYPE_MULTILINESTRING:'multilinestring', SPATIAL_TYPE_MULTIPOLYGON:'multipolygon',
	SPATIAL_TYPE_GEOMETRY_COLLECTION:'geometry_collection'
}

TYPE_CHARACTER = 1
TYPE_NUMBER = 2
TYPE_DATETIME = 3
TYPE_DATE = 4
TYPE_TIME = 5