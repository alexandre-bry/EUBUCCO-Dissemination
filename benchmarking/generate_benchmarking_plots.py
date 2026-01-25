import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import os

# --- STEP 0: MERGE FILES ---
files_to_merge = ["benchmark_Cyprus.csv", "benchmark_Spain.csv", "benchmark_France.csv"]
df_list = []
for f in files_to_merge:
    if os.path.exists(f):
        df_list.append(pd.read_csv(f))

if not df_list:
    print("No benchmark files found!")
    exit()

df = pd.concat(df_list, ignore_index=True)

# --- STEP 1: SETTINGS ---
sns.set_theme(style="whitegrid", context="talk")
plt.rcParams['font.family'] = 'serif'

format_order = ["GPKG", "Zipped GPKG", "GeoParquet", "FlatGeobuf"]
country_order = ["Cyprus", "Spain", "France"]
palette = {"GPKG": "#4C72B0", "Zipped GPKG": "#DD8452", "GeoParquet": "#55A868", "FlatGeobuf": "#C44E52"}

# --- FIGURE 1: STORAGE SIZE (Test 1) ---
plt.figure(figsize=(12, 6))
g1 = sns.barplot(data=df[df['Test'] == 'Storage Size'], x="Country", y="Value", hue="Format", 
                 hue_order=format_order, order=country_order, palette=palette)
plt.title("Test 1: Storage Size Comparison")
plt.ylabel("Size (MB)")
plt.legend(title="Format", bbox_to_anchor=(1.05, 1), loc='upper left')
plt.savefig("bench_1_size.png", dpi=300, bbox_inches='tight')

# --- FIGURE 2: ROW COUNT SPEED (Test 2) ---
plt.figure(figsize=(12, 6))
g2 = sns.barplot(data=df[df['Test'] == 'Row Count Speed'], x="Country", y="Value", hue="Format", 
                 hue_order=format_order, order=country_order, palette=palette)
g2.set_yscale("log")
plt.title("Test 2: Row Count Speed (Full Table Scan)")
plt.ylabel("Time (Seconds) - Log Scale")
plt.legend(title="Format", bbox_to_anchor=(1.05, 1), loc='upper left')
plt.savefig("bench_2_rowcount.png", dpi=300, bbox_inches='tight')

# --- FIGURE 3: CSV EXPORT SPEED (Test 3) ---
plt.figure(figsize=(12, 6))
g3 = sns.barplot(data=df[df['Test'] == 'CSV Export Speed'], x="Country", y="Value", hue="Format", 
                 hue_order=format_order, order=country_order, palette=palette)
g3.set_yscale("log")
plt.title("Test 3: CSV Export Speed (Geometry to WKT)")
plt.ylabel("Time (Seconds) - Log Scale")
plt.legend(title="Format", bbox_to_anchor=(1.05, 1), loc='upper left')
plt.savefig("bench_3_csvexport.png", dpi=300, bbox_inches='tight')

# --- FIGURE 4: ATTRIBUTE ACCESS (Test 4) ---
plt.figure(figsize=(12, 6))
g4 = sns.barplot(data=df[df['Test'] == 'Attr Avg'], x="Country", y="Value", hue="Format", 
                 hue_order=format_order, order=country_order, palette=palette)
g4.set_yscale("log")
plt.title("Test 4: Attribute Access Speed (Average Height)")
plt.ylabel("Time (Seconds) - Log Scale")
plt.legend(title="Format", bbox_to_anchor=(1.05, 1), loc='upper left')
plt.savefig("bench_4_attributes.png", dpi=300, bbox_inches='tight')

# --- FIGURE 5: SPATIAL QUERY SCALING (Test 5) ---
bbox_df = df[df['Test'] == 'BBox Filtering'].copy()
bbox_df['Metric'] = bbox_df['Metric'].str.replace('m', '').astype(int)

g5 = sns.relplot(
    data=bbox_df, kind="line", x="Metric", y="Value", hue="Format", col="Country",
    hue_order=format_order, col_order=country_order,
    marker="o", palette=palette, height=5, aspect=1, facet_kws={'sharey': False}
)
for ax in g5.axes.flat:
    ax.set_yscale("log")

g5.set_axis_labels("BBox Size (meters)", "Avg Query Time (Seconds) - Log Scale")
g5.set_titles("{col_name}")
plt.subplots_adjust(top=0.8)
g5.fig.suptitle('Test 5: Spatial Query Performance Scaling')
plt.savefig("bench_5_bbox.png", dpi=300, bbox_inches='tight')

print("5 Figures generated: bench_1_size.png to bench_5_bbox.png")